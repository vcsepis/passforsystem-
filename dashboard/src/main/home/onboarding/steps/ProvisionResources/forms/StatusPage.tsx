import Loading from "components/Loading";
import ProvisionerStatus from "components/ProvisionerStatus";
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "shared/api";
import { NewWebsocketOptions, useWebsockets } from "shared/hooks/useWebsockets";
import { Infrastructure } from "shared/types";
import styled from "styled-components";

type Props = {
  setInfraStatus: (status: { hasError: boolean; description?: string }) => void;
  project_id: number;
  filter: string[];
  notFoundText?: string;
  enableNewestInfraFilter?: boolean;
};

export const StatusPage = ({
  filter: selectedFilters,
  project_id,
  setInfraStatus,
  notFoundText = "We couldn't find any infra being provisioned.",
  enableNewestInfraFilter,
}: Props) => {
  const isMounted = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [infras, setInfras] = useState<Infrastructure[]>(null);

  useEffect(() => {
    api
      .getInfra<Infrastructure[]>("<token>", {}, { project_id: project_id })
      .then(({ data }) => {
        setInfras(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [project_id]);

  if (isLoading) {
    return (
      <Placeholder>
        <Loading />
      </Placeholder>
    );
  }

  if (infras.length == 0) {
    return <Placeholder>{notFoundText}</Placeholder>;
  }

  return <ProvisionerStatus infras={infras} project_id={project_id} />;
};

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

  > i {
    font-size: 18px;
    margin-right: 8px;
  }
`;
