package config

import (
	"github.com/gorilla/sessions"
	"github.com/porter-dev/porter/api/server/shared/apierrors/alerter"
	"github.com/porter-dev/porter/api/server/shared/config/env"
	"github.com/porter-dev/porter/api/server/shared/websocket"
	"github.com/porter-dev/porter/internal/analytics"
	"github.com/porter-dev/porter/internal/auth/token"
	"github.com/porter-dev/porter/internal/billing"
	"github.com/porter-dev/porter/internal/helm/urlcache"
	"github.com/porter-dev/porter/internal/integrations/cloudflare"
	"github.com/porter-dev/porter/internal/integrations/powerdns"
	"github.com/porter-dev/porter/internal/notifier"
	"github.com/porter-dev/porter/internal/oauth"
	"github.com/porter-dev/porter/internal/repository"
	"github.com/porter-dev/porter/internal/repository/credentials"
	"github.com/porter-dev/porter/pkg/logger"
	"github.com/porter-dev/porter/provisioner/client"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

type Config struct {
	// Logger for logging
	Logger *logger.Logger

	// Repo implements a query repository
	Repo repository.Repository

	// Metadata is a description object for the server metadata, used
	// to determine which endpoints to register
	Metadata *Metadata

	// Alerter sends messages to alert aggregators (like Sentry) if the
	// error is fatal
	Alerter alerter.Alerter

	// Store implements a session store for session-based cookies
	Store sessions.Store

	// ServerConf is the set of configuration variables for the Porter server
	ServerConf *env.ServerConf

	// DBConf is the set of configuration variables for the DB
	DBConf *env.DBConf

	// RedisConf is the set of configuration variables for the redis instance
	RedisConf *env.RedisConf

	// TokenConf contains the config for generating and validating JWT tokens
	TokenConf *token.TokenGeneratorConf

	// UserNotifier is an object that notifies users of transactions (pw reset, email
	// verification, etc)
	UserNotifier notifier.UserNotifier

	// DOConf is the configuration for a DigitalOcean OAuth client
	DOConf *oauth2.Config

	// GithubConf is the configuration for a Github OAuth client
	GithubConf *oauth2.Config

	// GithubAppConf is the configuration for a Github App OAuth client
	GithubAppConf *oauth.GithubAppConf

	// GoogleConf is the configuration for a Google OAuth client
	GoogleConf *oauth2.Config

	// SlackConf is the configuration for a Slack OAuth client
	SlackConf *oauth2.Config

	// WSUpgrader upgrades HTTP connections to websocket connections
	WSUpgrader *websocket.Upgrader

	// URLCache contains a cache of chart names to chart repos
	URLCache *urlcache.ChartURLCache

	// ProvisionerClient is an authenticated client for the provisioner service
	ProvisionerClient *client.Client

	// DB is the gorm DB instance
	DB *gorm.DB

	// AnalyticsClient if Segment analytics reporting is enabled on the API instance
	AnalyticsClient analytics.AnalyticsSegmentClient

	// BillingManager manages billing for Porter instances with billing enabled
	BillingManager billing.BillingManager

	// WhitelistedUsers do not count toward usage limits
	WhitelistedUsers map[uint]uint

	// PowerDNSClient is a client for PowerDNS, if the Porter instance supports vanity URLs
	PowerDNSClient *powerdns.Client

	// CloudflareDNSClient is a client for CloudflareDNS
	CloudflareDNSClient *cloudflare.Client

	// CredentialBackend is the backend for credential storage, if external cred storage (like Vault)
	// is used
	CredentialBackend credentials.CredentialStorage
}

type ConfigLoader interface {
	LoadConfig() (*Config, error)
}
