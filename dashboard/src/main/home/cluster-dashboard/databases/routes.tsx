import React from "react";
import { Route, Switch, useRouteMatch } from "react-router";
import DatabasesHome from "./DatabasesHome";

const DatabasesRoutes = () => {
  const { url } = useRouteMatch();
  return (
    <>
      <Switch>
        <Route path={`${url}/provision-database`}></Route>
        <Route path={`${url}/`}>
          <DatabasesHome />
        </Route>
      </Switch>
    </>
  );
};

export default DatabasesRoutes;
