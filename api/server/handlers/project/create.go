package project

import (
	"fmt"
	"github.com/porter-dev/porter/api/server/handlers/project_integration"
	"github.com/porter-dev/porter/internal/registry"
	"net/http"

	"github.com/porter-dev/porter/api/server/handlers"
	"github.com/porter-dev/porter/api/server/shared"
	"github.com/porter-dev/porter/api/server/shared/apierrors"
	"github.com/porter-dev/porter/api/server/shared/config"
	"github.com/porter-dev/porter/api/types"
	"github.com/porter-dev/porter/internal/analytics"
	"github.com/porter-dev/porter/internal/models"
	"github.com/porter-dev/porter/internal/repository"
)

type ProjectCreateHandler struct {
	handlers.PorterHandlerReadWriter
}

func NewProjectCreateHandler(
	config *config.Config,
	decoderValidator shared.RequestDecoderValidator,
	writer shared.ResultWriter,
) *ProjectCreateHandler {
	return &ProjectCreateHandler{
		PorterHandlerReadWriter: handlers.NewDefaultPorterHandler(config, decoderValidator, writer),
	}
}

func (p *ProjectCreateHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	request := &types.CreateProjectRequest{}

	ok := p.DecodeAndValidate(w, r, request)

	if !ok {
		return
	}

	// read the user from context
	user, _ := r.Context().Value(types.UserScope).(*models.User)

	proj := &models.Project{
		Name: request.Name,
	}

	var err error
	proj, role, err := CreateProjectWithUser(p.Repo().Project(), proj, user)

	if err != nil {
		p.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	// create onboading aws integration
	awsRequest := &types.CreateAWSRequest{
		AWSAccessKeyID:     p.Config().ServerConf.DefaultAWSIntAccessKey,
		AWSSecretAccessKey: p.Config().ServerConf.DefaultAWSIntAccessSecret,
		AWSRegion:          p.Config().ServerConf.DefaultAWSIntRegion,
	}
	aws := project_integration.CreateAWSIntegration(awsRequest, proj.ID, user.ID)
	aws, err = p.Repo().AWSIntegration().CreateAWSIntegration(aws)
	if err != nil {
		p.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	// create registry
	regReq := &types.CreateRegistryRequest{}
	regModel := &models.Registry{
		Name:               fmt.Sprintf("%s-ecr-registry", proj.Name),
		ProjectID:          proj.ID,
		URL:                "",
		GCPIntegrationID:   regReq.GCPIntegrationID,
		AWSIntegrationID:   aws.ToAWSIntegrationType().ID,
		DOIntegrationID:    regReq.DOIntegrationID,
		BasicIntegrationID: regReq.BasicIntegrationID,
	}

	if regModel.URL == "" && regModel.AWSIntegrationID != 0 {
		url, err := registry.GetECRRegistryURL(p.Repo().AWSIntegration(), regModel.ProjectID, regModel.AWSIntegrationID)

		if err != nil {
			p.HandleAPIError(w, r, apierrors.NewErrInternal(err))
			return
		}

		regModel.URL = url
	}
	// create new repository in registry with project name if not exists
	reg := registry.Registry(*regModel)
	regAPI := &reg
	if err = regAPI.CreateRepository(p.Repo(), fmt.Sprintf("%s-repository-%s-%s", proj.Name, proj.ID, user.ID)); err != nil {
		p.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	// handle write to the database
	regModel, err = p.Repo().Registry().CreateRegistry(regModel)

	if err != nil {
		p.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	// create onboarding flow set to the first step
	_, err = p.Repo().Onboarding().CreateProjectOnboarding(&models.Onboarding{
		ProjectID:                      proj.ID,
		CurrentStep:                    types.StepConnectSource,
		RegistryConnectionProvider:     "aws",
		RegistryConnectionID:           regModel.ToRegistryType().ID,
		RegistryConnectionCredentialID: aws.ToAWSIntegrationType().ID,
	})

	if err != nil {
		p.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	// create default project usage restriction
	_, err = p.Repo().ProjectUsage().CreateProjectUsage(&models.ProjectUsage{
		ProjectID:      proj.ID,
		ResourceCPU:    types.BasicPlan.ResourceCPU,
		ResourceMemory: types.BasicPlan.ResourceMemory,
		Clusters:       types.BasicPlan.Clusters,
		Users:          types.BasicPlan.Users,
	})

	if err != nil {
		p.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	p.WriteResult(w, r, proj.ToProjectType())

	// add project to billing team
	teamID, err := p.Config().BillingManager.CreateTeam(proj)

	if err != nil {
		// we do not write error response, since setting up billing error can be
		// resolved later and may not be fatal
		p.HandleAPIErrorNoWrite(w, r, apierrors.NewErrInternal(err))
	}

	if teamID != "" {
		err = p.Config().BillingManager.AddUserToTeam(teamID, user, role)

		if err != nil {
			// we do not write error response, since setting up billing error can be
			// resolved later and may not be fatal
			p.HandleAPIErrorNoWrite(w, r, apierrors.NewErrInternal(err))
		}
	}

	p.Config().AnalyticsClient.Track(analytics.ProjectCreateTrack(&analytics.ProjectCreateTrackOpts{
		ProjectScopedTrackOpts: analytics.GetProjectScopedTrackOpts(user.ID, proj.ID),
	}))
}

func CreateProjectWithUser(
	projectRepo repository.ProjectRepository,
	proj *models.Project,
	user *models.User,
) (*models.Project, *models.Role, error) {
	proj, err := projectRepo.CreateProject(proj)

	if err != nil {
		return nil, nil, err
	}

	// create a new Role with the user as the admin
	role, err := projectRepo.CreateProjectRole(proj, &models.Role{
		Role: types.Role{
			UserID:    user.ID,
			ProjectID: proj.ID,
			Kind:      types.RoleAdmin,
		},
	})

	if err != nil {
		return nil, nil, err
	}

	// read the project again to get the model with the role attached
	proj, err = projectRepo.ReadProject(proj.ID)

	if err != nil {
		return nil, nil, err
	}

	return proj, role, nil
}
