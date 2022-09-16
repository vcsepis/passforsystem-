package cluster

import (
	"encoding/json"
	"fmt"
	"github.com/porter-dev/porter/api/server/shared/apierrors"
	"github.com/porter-dev/porter/api/types"
	"io/ioutil"
	"net/http"

	"github.com/porter-dev/porter/api/server/handlers"
	"github.com/porter-dev/porter/api/server/shared"
	"github.com/porter-dev/porter/api/server/shared/config"
)

type ListClusterPlansHandler struct {
	handlers.PorterHandlerReadWriter
}

func NewListClusterPlansHandler(
	config *config.Config,
	writer shared.ResultWriter,
) *ListClusterPlansHandler {
	return &ListClusterPlansHandler{
		PorterHandlerReadWriter: handlers.NewDefaultPorterHandler(config, nil, writer),
	}
}

func (c *ListClusterPlansHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	planAPIUrl := fmt.Sprintf("%s/api/paas-plan", c.Config().ServerConf.KubeConfigAPIUrl)
	planAPIToken := fmt.Sprintf("Bearer %s", c.Config().ServerConf.KubeConfigAPIToken)

	req, _ := http.NewRequest(http.MethodGet, planAPIUrl, nil)
	req.Header.Set("Authorization", planAPIToken)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}

	defer res.Body.Close()

	resBytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}
	if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusBadRequest {
		if err != nil {
			c.HandleAPIError(w, r, apierrors.NewErrInternal(fmt.Errorf("request failed with status code %d, but could not read body (%s)\n", res.StatusCode, err.Error())))
		}
		c.HandleAPIError(w, r, apierrors.NewErrInternal(fmt.Errorf("request failed with status code %d: %s\n", res.StatusCode, string(resBytes))))
	}

	type ReturnBody struct {
		Success string                        `json:"success"`
		Message string                        `json:"message"`
		Data    types.ListClusterPlanResponse `json:"data"`
	}
	var retBody ReturnBody
	json.Unmarshal(resBytes, &retBody)

	c.WriteResult(w, r, retBody.Data)
}
