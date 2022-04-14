import Loading from "components/Loading";
import TabSelector from "components/TabSelector";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router";
import api from "shared/api";
import { Context } from "shared/Context";
import { useRouting } from "shared/routing";
import styled from "styled-components";
import ButtonEnablePREnvironments from "./components/ButtonEnablePREnvironments";
import DashboardHeader from "../DashboardHeader";
import PullRequestIcon from "assets/pull_request_icon.svg";
import DeploymentList from "./deployments/DeploymentList";
import EnvironmentsList from "./environments/EnvironmentsList";
import { environments } from "./mocks";

const AvailableTabs = ["repositories", "pull_requests"];

type TabEnum = typeof AvailableTabs[number];

const PreviewEnvironmentsHome = () => {
  const { currentCluster, currentProject } = useContext(Context);

  const [hasGHAccountsLinked, setHasGHAccountsLinked] = useState(false);
  const [hasEnvironments, setHasEnvironments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [environments, setEnvironments] = useState([]);

  const [currentTab, setCurrentTab] = useState<TabEnum>("repositories");
  const { getQueryParam, pushQueryParams } = useRouting();
  const location = useLocation();
  const history = useHistory();

  const getAccounts = async () => {
    try {
      const res = await api.getGithubAccounts("<token>", {}, {});
      if (res.status !== 200) {
        throw new Error("Not authorized");
      }

      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const getEnvironments = async () => {
    try {
      const { data } = await api.listEnvironments(
        "<token>",
        {},
        {
          project_id: currentProject?.id,
          cluster_id: currentCluster?.id,
        }
      );

      return data;
    } catch (error) {
      throw error;
    }
  };

  const checkPreviewEnvironmentsEnabling = async (subscribeStauts: {
    subscribed: boolean;
  }) => {
    try {
      await getAccounts();

      const envs = await getEnvironments();
      // const envs = await mockRequest();

      if (!subscribeStauts.subscribed) {
        return;
      }

      if (!Array.isArray(envs)) {
        setHasGHAccountsLinked(true);
        return;
      }

      setHasGHAccountsLinked(true);
      setHasEnvironments(true);
      setEnvironments(envs);
    } catch (error) {
      setHasGHAccountsLinked(false);
    }
  };

  useEffect(() => {
    let subscribedStatus = { subscribed: true };

    setIsLoading(true);

    checkPreviewEnvironmentsEnabling(subscribedStatus).finally(() => {
      if (subscribedStatus.subscribed) {
        setIsLoading(false);
      }
    });

    return () => {
      subscribedStatus.subscribed = false;
    };
  }, [currentCluster, currentProject]);

  useEffect(() => {
    const current_tab = getQueryParam("current_tab");

    if (!AvailableTabs.includes(current_tab)) {
      pushQueryParams({}, ["current_tab"]);
      return;
    }

    if (current_tab !== currentTab) {
      setCurrentTab(current_tab);
    }
  }, [location.search, history]);

  const renderMain = () => {
    if (isLoading) {
      return (
        <Placeholder>
          <Loading />
        </Placeholder>
      );
    }
  
    if (hasError) {
      return <Placeholder>Something went wrong, please try again</Placeholder>;
    }
  
    if (!hasGHAccountsLinked && false) { // ret2
      return (
        <Placeholder>
          <Title>There are no repositories linked</Title>
          <Subtitle>
            In order to use preview environments, you must install the porter
            app in at least one repository.
          </Subtitle>
          <ButtonEnablePREnvironments />
        </Placeholder>
      );
    }
  
    if (!hasEnvironments && false) { // ret2
      return (
        <Placeholder>
          <Title>Preview environments are not enabled on this cluster</Title>
          <Subtitle>
            In order to use preview environments, you must enable preview
            environments on this cluster.
          </Subtitle>
          <ButtonEnablePREnvironments />
        </Placeholder>
      );
    }
    // ret2: environments={environments}
    return (
      <EnvironmentsList
        environments={[
          {
            id: 0,
            project_id: 1,
            cluster_id: 1,
            git_installation_id: 123,
            name: "some-placeholder-name",
            git_repo_owner: "some-repo-owner",
            git_repo_name: "my-cool-repo",
            last_deployment_status: "failed",
            deployment_count: 12,
            mode: "manual",
          },
          {
            id: 1,
            project_id: 1,
            cluster_id: 2,
            git_installation_id: 123,
            name: "might-be-seeing-double",
            git_repo_owner: "sonlux",
            git_repo_name: "everything-everywhere-all-at-once",
            last_deployment_status: "created",
            deployment_count: 24,
            mode: "auto",
          },
          {
            id: 2,
            project_id: 1,
            cluster_id: 1,
            git_installation_id: 123,
            name: "secret-sky",
            git_repo_owner: "madeon",
            git_repo_name: "heavy-with-hoping",
            last_deployment_status: "inactive",
            deployment_count: 12,
            mode: "manual",
          }
        ]}
        setEnvironments={setEnvironments}
      />
    );
  }

  return (
    <>
      <DashboardHeader
        image={PullRequestIcon}
        title="Preview Environments"
        description="Create full-stack preview environments for your pull requests."
      />
      {renderMain()}
    </>
  );
};

/*
<DeploymentList environments={environments} />
*/
export default PreviewEnvironmentsHome;

const mockRequest = () =>
  new Promise((res) => {
    setTimeout(() => {
      res({ data: environments });
    }, 1000);
  });

const LineBreak = styled.div`
  width: calc(100% - 0px);
  height: 2px;
  background: #ffffff20;
  margin: 10px 0px 35px;
`;

const Placeholder = styled.div`
  padding: 30px;
  margin-top: 35px;
  padding-bottom: 40px;
  font-size: 13px;
  color: #ffffff44;
  min-height: 400px;
  height: 50vh;
  background: #ffffff11;
  border-radius: 8px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  > i {
    font-size: 18px;
    margin-right: 8px;
  }
`;

const Title = styled.div`
  font-weight: 500;
  color: #aaaabb;
  font-size: 16px;
  margin-bottom: 15px;
  width: 50%;
`;

const Subtitle = styled.div`
  width: 50%;
`;
