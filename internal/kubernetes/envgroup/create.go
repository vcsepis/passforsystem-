package envgroup

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/porter-dev/porter/api/types"
	"github.com/porter-dev/porter/internal/helm"
	"github.com/porter-dev/porter/internal/kubernetes"
	"helm.sh/helm/v3/pkg/release"
	v1 "k8s.io/api/core/v1"
)

func CreateEnvGroup(agent *kubernetes.Agent, input types.ConfigMapInput) (*v1.ConfigMap, error) {
	// look for a latest configmap
	oldCM, latestVersion, err := agent.GetLatestVersionedConfigMap(input.Name, input.Namespace)

	if err != nil && !errors.Is(err, kubernetes.IsNotFoundError) {
		return nil, err
	} else if err != nil {
		latestVersion = 1
	} else {
		latestVersion += 1
	}

	apps := make([]string, 0)

	if oldCM != nil {
		oldEG, err := ToEnvGroup(oldCM)

		if err == nil {
			apps = oldEG.Applications
		}
	}

	oldSecret, _, err := agent.GetLatestVersionedSecret(input.Name, input.Namespace)

	if err != nil && !errors.Is(err, kubernetes.IsNotFoundError) {
		return nil, err
	} else if err == nil && oldSecret != nil {
		// In this case, we find all old variables referencing a secret value, and add those
		// values to the new secret variables. The frontend will only send **new** secret values.
		for key1, val1 := range input.Variables {
			if strings.Contains(val1, "PORTERSECRET") {
				// get that value from the secret
				for key2, val2 := range oldSecret.Data {
					if key2 == key1 {
						input.SecretVariables[key1] = string(val2)
					}
				}
			}
		}
	}

	// add all secret env variables to configmap with value PORTERSECRET_${configmap_name}
	for key := range input.SecretVariables {
		input.Variables[key] = fmt.Sprintf("PORTERSECRET_%s.v%d", input.Name, latestVersion)
	}

	cm, err := agent.CreateVersionedConfigMap(input.Name, input.Namespace, latestVersion, input.Variables, apps...)

	if err != nil {
		return nil, err
	}

	secretData := EncodeSecrets(input.SecretVariables)

	// create secret first
	if _, err := agent.CreateLinkedVersionedSecret(input.Name, input.Namespace, cm.ObjectMeta.Name, latestVersion, secretData); err != nil {
		return nil, err
	}

	return cm, err
}

func ToEnvGroup(configMap *v1.ConfigMap) (*types.EnvGroup, error) {
	res := &types.EnvGroup{
		Namespace: configMap.Namespace,
		Variables: configMap.Data,
	}

	// get the name
	name, nameExists := configMap.Labels["envgroup"]

	if !nameExists {
		return nil, fmt.Errorf("not a valid configmap: envgroup label does not exist")
	}

	res.Name = name

	// get the version
	versionLabelStr, versionLabelExists := configMap.Labels["version"]

	if !versionLabelExists {
		return nil, fmt.Errorf("not a valid configmap: version label does not exist")
	}

	versionInt, err := strconv.Atoi(versionLabelStr)

	if err != nil {
		return nil, fmt.Errorf("not a valid configmap, error converting version: %v", err)
	}

	res.Version = uint(versionInt)

	// get applications, if they exist
	appStr, appAnnonExists := configMap.Annotations[kubernetes.PorterAppAnnotationName]

	if appAnnonExists && appStr != "" {
		res.Applications = strings.Split(appStr, ",")
	} else {
		res.Applications = []string{}
	}

	return res, nil
}

func GetSyncedReleases(helmAgent *helm.Agent, configMap *v1.ConfigMap) ([]*release.Release, error) {
	res := make([]*release.Release, 0)

	// get applications, if they exist
	appStr, appAnnonExists := configMap.Annotations[kubernetes.PorterAppAnnotationName]

	if !appAnnonExists || appStr == "" {
		return res, nil
	}

	appStrArr := strings.Split(appStr, ",")

	// list all latest helm releases and check them against app string
	releases, err := helmAgent.ListReleases(configMap.Namespace, &types.ReleaseListFilter{
		StatusFilter: []string{
			"deployed",
			"uninstalled",
			"pending",
			"pending-install",
			"pending-upgrade",
			"pending-rollback",
			"failed",
		},
	})

	if err != nil {
		return nil, err
	}

	for _, rel := range releases {
		for _, appName := range appStrArr {
			if rel.Name == appName {
				res = append(res, rel)
			}
		}
	}

	return res, nil
}

func EncodeSecrets(data map[string]string) map[string][]byte {
	res := make(map[string][]byte)

	for key, rawValue := range data {
		res[key] = []byte(rawValue)
	}

	return res
}
