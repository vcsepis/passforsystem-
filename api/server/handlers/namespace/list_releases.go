package namespace

import (
	"net/http"

	"github.com/porter-dev/porter/api/server/authz"
	"github.com/porter-dev/porter/api/server/handlers"
	"github.com/porter-dev/porter/api/server/shared"
	"github.com/porter-dev/porter/api/server/shared/apierrors"
	"github.com/porter-dev/porter/api/server/shared/config"
	"github.com/porter-dev/porter/api/types"
	"github.com/porter-dev/porter/internal/models"
)

type ListReleasesHandler struct {
	handlers.PorterHandlerReadWriter
	authz.KubernetesAgentGetter
}

func NewListReleasesHandler(
	config *config.Config,
	decoderValidator shared.RequestDecoderValidator,
	writer shared.ResultWriter,
) *ListReleasesHandler {
	return &ListReleasesHandler{
		PorterHandlerReadWriter: handlers.NewDefaultPorterHandler(config, decoderValidator, writer),
		KubernetesAgentGetter:   authz.NewOutOfClusterAgentGetter(config),
	}
}

func (c *ListReleasesHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	request := &types.ListReleasesRequest{}

	if ok := c.DecodeAndValidate(w, r, request); !ok {
		return
	}

	namespace := r.Context().Value(types.NamespaceScope).(string)
	cluster, _ := r.Context().Value(types.ClusterScope).(*models.Cluster)

	// helmAgent, err := c.GetHelmAgent(r, cluster, "")
	agent, err := c.GetAgent(r, cluster, "")

	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	releases, err := agent.GetHelmReleasesSecrets(namespace)

	// UNCOMMENT FOR TESTING DIRECT USE OF THE HELM AGENT LIST RELEASES
	// releases, err := func() ([]*release.Release, error) {
	// 	defer timeTrack(time.Now(), "GET RELEASES")
	// 	return helmAgent.ListReleases(namespace, request.ReleaseListFilter)
	// }()

	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	// var res types.ListReleasesResponse = releases

	// c.WriteResult(w, r, res)
	// release := releases[0]
	// release.Data["release"] = nil
	c.WriteResult(w, r, releases)
}

// func timeTrack(start time.Time, name string) {
// 	elapsed := time.Since(start)
// 	fmt.Printf("\n\n%s took %s\n\n", name, elapsed)
// }
