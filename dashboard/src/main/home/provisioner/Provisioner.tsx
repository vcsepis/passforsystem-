import React, { Component } from "react";
import styled from "styled-components";

import api from "shared/api";
import { Context } from "shared/Context";
import { InfraType, ProjectType } from "shared/types";
import Loading from "components/Loading";

import InfraStatuses from "./InfraStatuses";
import ProvisionerLogs from "./ProvisionerLogs";
import { RouteComponentProps, withRouter } from "react-router";
import { stringify } from "qs";
import { forEach } from "lodash";

type PropsType = RouteComponentProps & {};

type StateType = {
  error: boolean;
  logs: string[];
  websockets: any[];
  maxStep: Record<string, number>;
  currentStep: Record<string, number>;
  triggerEnd: boolean;
  infras: InfraType[];
  loading: boolean;
  selectedInfra: InfraType;
  currentProject: ProjectType;
};

class Provisioner extends Component<PropsType, StateType> {
  state = {
    error: false,
    logs: [] as string[],
    websockets: [] as any[],
    maxStep: {} as Record<string, any>,
    currentStep: {} as Record<string, number>,
    triggerEnd: false,
    infras: [] as InfraType[],
    selectedInfra: null as InfraType,
    loading: true,
    currentProject: this.context.currentProject
  };

  selectInfra = (infra: InfraType) => {
    this.setState({ selectedInfra: infra });
  };

  componentDidMount() {
    this.updateInfras();
  }

  componentDidUpdate(prevProps: PropsType, prevState: StateType) {
    // Check that an infra that was previously in a non-created state, and
    // which was a cluster, is now in a created state. If so, propagate update
    // so that cluster can be refreshed.
    let prevInfraStates: Record<number, string> = {};

    prevState.infras.forEach((infra, i) => {
      prevInfraStates[infra.id] = infra.status;
    });

    this.state.infras.forEach((infra, i) => {
      if (
        prevInfraStates[infra.id] &&
        infra.status == "created" &&
        prevInfraStates[infra.id] != "created"
      ) {
        api
          .getClusters("<token>", {}, { id: this.context.currentProject.id })
          .then(res => {
            this.context.setCurrentCluster(res.data[0]);
          })
          .catch(err => {
            this.context.setCurrentError(err);
          });
      }
    });
  }

  refresh = () => {
    this.updateInfras();
  };

  updateInfras = () => {
    this.setState({
      loading: true
    });

    let { currentProject } = this.state;

    api
      .getInfra(
        "<token>",
        {},
        {
          project_id: currentProject.id
        }
      )
      .then(res => {
        let infras = res.data.sort((a: InfraType, b: InfraType) => {
          return b.id - a.id;
        });

        this.setState({
          error: false,
          infras,
          loading: false,
          selectedInfra: infras[0]
        });
      })
      .catch();
  };

  render() {
    if (this.state.loading) {
      return (
        <StyledProvisioner>
          <Loading />
        </StyledProvisioner>
      );
    }

    if (this.state.infras.length > 0) {
      return (
        <StyledProvisioner>
          <TabWrapper>
            <InfraStatuses
              infras={this.state.infras}
              selectInfra={this.selectInfra.bind(this)}
              selectedInfra={this.state.selectedInfra}
            />
          </TabWrapper>

          <ProvisionerLogs
            key={this.state.selectedInfra?.id}
            selectedInfra={this.state.selectedInfra}
            updateInfras={this.updateInfras}
          />
        </StyledProvisioner>
      );
    }

    return (
      <StyledProvisioner>
        You have not provisioned any resources for this project through Porter.{" "}
        <RefreshText onClick={this.refresh}>Refresh</RefreshText>
      </StyledProvisioner>
    );
  }
}

Provisioner.contextType = Context;

export default withRouter(Provisioner);

const StyledProvisioner = styled.div`
  width: 100%;
  height: 350px;
  background: #ffffff11;
  color: #aaaabb;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  margin-top: 10px;
`;

const TabWrapper = styled.div`
  width: 35%;
  min-width: 250px;
  height: 100%;
  overflow-y: auto;
`;

const RefreshText = styled.div`
  display: inline;
  margin-left: 4px;
  color: #8590ff;
  cursor: pointer;
`;
