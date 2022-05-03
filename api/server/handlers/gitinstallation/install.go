package gitinstallation

import (
	"fmt"
	"net/http"

	"github.com/porter-dev/porter/api/server/handlers"
	"github.com/porter-dev/porter/api/server/shared/config"
)

type GithubAppInstallHandler struct {
	handlers.PorterHandler
}

func NewGithubAppInstallHandler(
	config *config.Config,
) *GithubAppInstallHandler {
	return &GithubAppInstallHandler{
		PorterHandler: handlers.NewDefaultPorterHandler(config, nil, nil),
	}
}

func (c *GithubAppInstallHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fmt.Println(fmt.Sprintf("[DEBUG] redirecting to github with config app %v", c.Config().GithubAppConf))
	session, err := c.Config().Store.Get(r, c.Config().ServerConf.CookieName)

	if err != nil {
		fmt.Println(fmt.Sprintf("[ERROR] cannot get current session. Error = %v", err))
	}
	if redirect := r.URL.Query().Get("redirect_uri"); redirect != "" {
		session.Values["redirect_uri"] = redirect
		fmt.Println(fmt.Sprintf("[DEBUG] saved session value. Redirect URI = %v", redirect))
	}
	if err := session.Save(r, w); err != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Cannot save session values. Error = %v", err))
	}
	http.Redirect(w, r, fmt.Sprintf("https://github.com/apps/%s/installations/new", c.Config().GithubAppConf.AppName), 302)
}
