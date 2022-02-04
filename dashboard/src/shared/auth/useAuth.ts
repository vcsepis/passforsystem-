import { useCallback, useContext } from "react";
import { AuthPolicyContext } from "./AuthPolicyContext";
import { isAuthorized } from "./authorization-helpers";
import { ScopeType, Verbs } from "./types";

const useAuth = () => {
  const authPolicyContext = useContext(AuthPolicyContext);

  const isAuth = useCallback(
    (
      scope: ScopeType,
      resource: string | string[],
      verb: Verbs | Array<Verbs>
    ) => isAuthorized(authPolicyContext.currentPolicy, scope, resource, verb),
    [authPolicyContext.currentPolicy]
  );

  return [isAuth];
};

export default useAuth;
