package registry

import (
	"fmt"
	"net/http"

	"github.com/porter-dev/porter/api/server/handlers"
	"github.com/porter-dev/porter/api/server/shared"
	"github.com/porter-dev/porter/api/server/shared/apierrors"
	"github.com/porter-dev/porter/api/server/shared/config"
	"github.com/porter-dev/porter/api/types"
	"github.com/porter-dev/porter/internal/models"
	"github.com/porter-dev/porter/internal/registry"
)

type RegistryListRepositoriesHandler struct {
	handlers.PorterHandlerWriter
}

func NewRegistryListRepositoriesHandler(
	config *config.Config,
	writer shared.ResultWriter,
) *RegistryListRepositoriesHandler {
	return &RegistryListRepositoriesHandler{
		PorterHandlerWriter: handlers.NewDefaultPorterHandler(config, nil, writer),
	}
}

func (c *RegistryListRepositoriesHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	reg, _ := r.Context().Value(types.RegistryScope).(*models.Registry)

	// cast to a registry from registry package
	_reg := registry.Registry(*reg)
	regAPI := &_reg

	repos, err := regAPI.ListRepositories(c.Repo(), c.Config().DOConf)

	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	//fmt.Println(fmt.Sprintf("[DEBUG] repos: %v", repos))

	// get Project
	proj, err := c.Repo().Project().ReadProject(reg.ProjectID)
	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}
	repoName := fmt.Sprintf("%s-repository", proj.Name)
	var retRepos = []*types.RegistryRepository{}
	for _, repo := range repos {
		if repo.Name == repoName {
			retRepos = append(retRepos, repo)
		}
	}

	c.WriteResult(w, r, retRepos)
}
