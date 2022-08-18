package config

import (
	"github.com/porter-dev/porter/api/server/shared/config/env"
)

type Metadata struct {
	Provisioning       bool   `json:"provisioner"`
	Github             bool   `json:"github"`
	BasicLogin         bool   `json:"basic_login"`
	GithubLogin        bool   `json:"github_login"`
	GoogleLogin        bool   `json:"google_login"`
	SlackNotifications bool   `json:"slack_notifications"`
	Email              bool   `json:"email"`
	Analytics          bool   `json:"analytics"`
	Version            string `json:"version"`
	Gitlab             bool   `json:"gitlab"`
}

func MetadataFromConf(sc *env.ServerConf, version string) *Metadata {
	return &Metadata{
		Provisioning:       sc.ProvisionerServerURL != "" && sc.ProvisionerToken != "",
		Github:             hasGithubAppVars(sc),
		GithubLogin:        sc.GithubClientID != "" && sc.GithubClientSecret != "" && sc.GithubLoginEnabled,
		BasicLogin:         sc.BasicLoginEnabled,
		GoogleLogin:        sc.GoogleClientID != "" && sc.GoogleClientSecret != "",
		SlackNotifications: sc.SlackClientID != "" && sc.SlackClientSecret != "",
		Email:              sc.SendgridAPIKey != "",
		Analytics:          sc.SegmentClientKey != "",
		Version:            version,
		Gitlab:             sc.EnableGitlab,
	}
}

func hasGithubAppVars(sc *env.ServerConf) bool {
	return sc.GithubAppClientID != "" &&
		sc.GithubAppClientSecret != "" &&
		sc.GithubAppName != "" &&
		sc.GithubAppWebhookSecret != "" &&
		sc.GithubAppSecretPath != "" &&
		sc.GithubAppID != ""
}
