import React from "react";
import { Route, Switch } from "react-router-dom";
import { useParams, withRouter } from "react-router";
import InfrastructureList from "./InfrastructureList";
import ExpandedInfra from "./ExpandedInfra";
import ProvisionInfra from "./components/ProvisionInfra";

type ExpandedInfraParams = {
  infra_id: string;
};

const InfrastructureRouter = () => {
  const { infra_id } = useParams<ExpandedInfraParams>();

  return (
    <Switch>
      <Route
        path="/infrastructure/provision"
        render={() => <ProvisionInfra />}
      />
      <Route
        path="/infrastructure/:infra"
        render={() => <ExpandedInfra infra_id={parseInt(infra_id)} />}
      />
      <Route path="/infrastructure" render={() => <InfrastructureList />} />
    </Switch>
  );
};

export default withRouter(InfrastructureRouter);
