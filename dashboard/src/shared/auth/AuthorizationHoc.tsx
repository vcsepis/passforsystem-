import React, { useCallback, useContext } from "react";
import { AuthPolicyContext } from "./AuthPolicyContext";
import { isAuthorized } from "./authorization-helpers";
import { ScopeType, Verbs } from "./types";
import useAuth from "./useAuth";

export const GuardedComponent = <ComponentProps extends object>(
  scope: ScopeType,
  resource: string,
  verb: Verbs | Array<Verbs>
) => (Component: any) => (props: ComponentProps) => {
  const authPolicyContext = useContext(AuthPolicyContext);

  if (isAuthorized(authPolicyContext.currentPolicy, scope, resource, verb)) {
    return <Component {...props} />;
  }

  return null;
};

export type WithAuthProps = {
  isAuthorized: (
    scope: ScopeType,
    resource: string | Array<string>,
    verb: Verbs | Array<Verbs>
  ) => boolean;
  authenticate: () => Promise<void>;
  logout: () => Promise<boolean>;
};

export function withAuth<P>(
  // Then we need to type the incoming component.
  // This creates a union type of whatever the component
  // already accepts AND our extraInfo prop
  WrappedComponent: React.ComponentType<P & WithAuthProps>
) {
  const displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  const C = (props: P) => {
    const [isAuth, logout, authenticate] = useAuth();
    // At this point, the props being passed in are the original props the component expects.
    return (
      <WrappedComponent
        {...props}
        isAuthorized={isAuth}
        authenticate={authenticate}
        logout={logout}
      />
    );
  };

  C.displayName = displayName;
  C.WrappedComponent = WrappedComponent;
  return C;
}
