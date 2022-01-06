import React from "react";
import { Route, Switch, useRouteMatch } from "react-router";
import CreateDatabaseForm from "./CreateDatabaseForm";
import DatabasesHome from "./DatabasesHome";

const DatabasesRoutes = () => {
  const { url } = useRouteMatch();
  return (
    <>
      <Switch>
        <Route path={`${url}/provision-database`}>
          <CreateDatabaseForm />
        </Route>
        <Route path={`${url}/`}>
          <DatabasesHome />
        </Route>
      </Switch>
    </>
  );
};

export default DatabasesRoutes;
