import React, { Component } from "react";
import { Route, Redirect, Switch } from "react-router-dom";

import api from "shared/api";
import { Context } from "shared/Context";
import Cohere from "cohere-js";

Cohere.init(process.env.COHERE_API_KEY);

import ResetPasswordInit from "./auth/ResetPasswordInit";
import ResetPasswordFinalize from "./auth/ResetPasswordFinalize";
import Login from "./auth/Login";
import Register from "./auth/Register";
import VerifyEmail from "./auth/VerifyEmail";
import CurrentError from "./CurrentError";
import Home from "./home/Home";
import Loading from "components/Loading";
import { PorterUrl, PorterUrls } from "shared/routing";
import { withAuth, WithAuthProps } from "shared/auth/AuthorizationHoc";

type PropsType = WithAuthProps & {};

type StateType = {
  local: boolean;
};

class Main extends Component<PropsType, StateType> {
  state = {
    loading: true,
    isLoggedIn: false,
    isEmailVerified: false,
    initialized: localStorage.getItem("init") === "true",
    local: false,
  };

  componentDidMount() {
    let { setUser, setCurrentError } = this.context;
    let urlParams = new URLSearchParams(window.location.search);
    let error = urlParams.get("error");
    error && setCurrentError(error);

    api
      .getMetadata("", {}, {})
      .then((res) => {
        this.context.setEdition(res.data?.version);
        this.setState({ local: !res.data?.provisioner });
      })
      .catch((err) => console.log(err));
  }

  initialize = () => {
    localStorage.setItem("init", "true");
  };

  renderMain = () => {
    if (this.props.isLoadingAuth) {
      return <Loading />;
    }

    // if logged in but not verified, block until email verification
    if (
      !this.state.local &&
      this.props.isLoggedIn &&
      !this.props.isEmailVerified
    ) {
      return (
        <Switch>
          <Route
            path="/"
            render={() => {
              return <VerifyEmail />;
            }}
          />
        </Switch>
      );
    }

    return (
      <Switch>
        <Route
          path="/login"
          render={() => {
            if (!this.props.isLoggedIn) {
              return <Login />;
            } else {
              return <Redirect to="/" />;
            }
          }}
        />
        <Route
          path="/register"
          render={() => {
            if (!this.props.isLoggedIn) {
              return <Register />;
            } else {
              return <Redirect to="/" />;
            }
          }}
        />
        <Route
          path="/password/reset/finalize"
          render={() => {
            if (!this.props.isLoggedIn) {
              return <ResetPasswordFinalize />;
            } else {
              return <Redirect to="/" />;
            }
          }}
        />
        <Route
          path="/password/reset"
          render={() => {
            if (!this.props.isLoggedIn) {
              return <ResetPasswordInit />;
            } else {
              return <Redirect to="/" />;
            }
          }}
        />
        <Route
          exact
          path="/"
          render={() => {
            if (this.props.isLoggedIn) {
              return <Redirect to="/dashboard" />;
            } else {
              return <Redirect to="/login" />;
            }
          }}
        />
        <Route
          path={`/:baseRoute/:cluster?/:namespace?`}
          render={(routeProps) => {
            const baseRoute = routeProps.match.params.baseRoute;
            if (
              this.props.isLoggedIn &&
              this.props.initialized &&
              PorterUrls.includes(baseRoute)
            ) {
              return (
                <Home
                  key="home"
                  currentProject={this.context.currentProject}
                  currentCluster={this.context.currentCluster}
                  currentRoute={baseRoute as PorterUrl}
                />
              );
            } else {
              return <Redirect to="/" />;
            }
          }}
        />
      </Switch>
    );
  };

  render() {
    return (
      <>
        {this.renderMain()}
        <CurrentError currentError={this.context.currentError} />
      </>
    );
  }
}

Main.contextType = Context;

export default withAuth(Main);
