import React, { useContext, useEffect, useState } from "react";
import api from "shared/api";
import { Context } from "shared/Context";
import { POLICY_HIERARCHY_TREE, populatePolicy } from "./authorization-helpers";
import { PolicyDocType } from "./types";

type AuthPolicyContext = {
  currentPolicy: PolicyDocType;
};

export const AuthPolicyContext = React.createContext<AuthPolicyContext>(
  {} as AuthPolicyContext
);

const AuthProvider: React.FC = ({ children }) => {
  const { user, currentProject } = useContext(Context);
  const [currentPolicy, setCurrentPolicy] = useState(null);

  useEffect(() => {
    let isSubscribed = true;
    if (!user || !currentProject?.id) {
      setCurrentPolicy(null);
    } else {
      api
        .getPolicyDocument("<token>", {}, { project_id: currentProject?.id })
        .then((res) => {
          if (!isSubscribed) {
            return;
          }
          const currentPolicy = res.data[0];
          setCurrentPolicy(
            populatePolicy(
              currentPolicy,
              POLICY_HIERARCHY_TREE,
              currentPolicy.scope,
              currentPolicy.verbs
            )
          );
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [user, currentProject?.id]);

  return (
    <AuthPolicyContext.Provider value={{ currentPolicy }}>
      {children}
    </AuthPolicyContext.Provider>
  );
};

export default AuthProvider;
