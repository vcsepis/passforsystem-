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

	req, _ := http.NewRequest(http.MethodGet, "https://k8sconfig.myepis.cloud/api/paas-plan", nil)
	req.Header.Set("Authorization", "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vazhzY29uZmlnLm15ZXBpcy5jbG91ZC9hcGkvbG9naW4iLCJpYXQiOjE2NjMyNTc2OTIsImV4cCI6NDgxNjg1NzY5MiwibmJmIjoxNjYzMjU3NjkyLCJqdGkiOiIyYkxQUlZPWXE2bDFGdDJ6Iiwic3ViIjo4LCJwcnYiOiI4N2UwYWYxZWY5ZmQxNTgxMmZkZWM5NzE1M2ExNGUwYjA0NzU0NmFhIiwiaXMiOiJodHRwOi8vbG9jYWxob3N0IiwiaGkiOiJDdXN0b21DbGFpbXMifQ.lTTRPBEpxDeg88YsX35vySZ3P5GS2By_cjAc5hPaAnU")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		c.HandleAPIError(w, r, apierrors.NewErrInternal(err))
		return
	}
	fmt.Println("Request success")
	fmt.Println(res)

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

	type returnBody struct {
		data types.ListClusterPlanResponse `json:"data"`
	}
	var retBody returnBody
	fmt.Println("Return body")
	fmt.Println(string(resBytes))
	json.Unmarshal(resBytes, &retBody)
	fmt.Println("Parsed body")
	fmt.Println(retBody)

	c.WriteResult(w, r, retBody.data)
}
