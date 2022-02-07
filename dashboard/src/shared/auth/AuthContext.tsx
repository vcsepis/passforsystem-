import React, { createContext, useContext, useEffect, useState } from "react";
import api from "shared/api";

import Cohere from "cohere-js";
import { Context } from "shared/Context";
import AuthPolicyProvider, { AuthPolicyContext } from "./AuthPolicyContext";

Cohere.init(process.env.COHERE_API_KEY);

export type AuthContextActions = {
  logout: () => Promise<boolean>;
  authenticate: () => Promise<void>;
};

export type AuthContextType = {
  isLoggedIn: boolean;
  isEmailVerified: boolean;
  initialized: boolean;
  isLoadingAuth: boolean;
};

export const AuthContext = createContext<AuthContextType & AuthContextActions>({
  isLoggedIn: false,
  isEmailVerified: false,
  initialized: false,
  isLoadingAuth: true,
  logout: null,
  authenticate: null,
});

export const AuthProvider: React.FC<{}> = ({ children }) => {
  const { setUser, setCurrentError, clearContext, user } = useContext(Context);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(
    () => localStorage.getItem("init") === "true"
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .checkAuth("", {}, {})
      .then((res) => {
        if (res && res?.data) {
          setUser(res?.data?.id, res?.data?.email);
          setIsLoggedIn(true);
          setIsEmailVerified(res?.data?.email_verified);
          setInitialized(true);
        } else {
          setIsLoggedIn(false);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        setIsLoggedIn(false);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    Cohere.identify(user?.userId, {
      displayName: user?.email,
      email: user?.email,
    });
  }, [user]);

  const logout = async () => {
    try {
      await api.logOutUser("<token>", {}, {});
      clearContext();
      setIsLoggedIn(false);
      setInitialized(true);
      localStorage.clear();
      return true;
    } catch (err) {
      setCurrentError(err.response?.data.errors[0]);
    }
  };

  const authenticate = async () => {
    try {
      const res = await api.checkAuth("", {}, {});

      if (res && res?.data) {
        setUser(res?.data?.id, res?.data?.email);
        setUser(res?.data?.id, res?.data?.email);
        setIsLoggedIn(true);
        setIsEmailVerified(res?.data?.email_verified);
        setInitialized(true);
        setIsLoading(false);
      } else {
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    } catch (err) {}
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isEmailVerified,
        initialized,
        isLoadingAuth: isLoading,
        logout,
        authenticate,
      }}
    >
      <AuthPolicyProvider>{children}</AuthPolicyProvider>
    </AuthContext.Provider>
  );
};
