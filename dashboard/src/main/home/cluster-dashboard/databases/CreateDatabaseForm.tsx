import InputRow from "components/form-components/InputRow";
import SelectRow from "components/form-components/SelectRow";
import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Context } from "shared/Context";
import styled from "styled-components";
import DashboardHeader from "../DashboardHeader";
import {
  LAST_POSTGRES_ENGINE_VERSION,
  postgres_engine_versions,
} from "./static_data";

const CreateDatabaseForm = () => {
  const { currentProject, currentCluster } = useContext(Context);
  const [databaseName, setDatabaseName] = useState(
    () => `${currentProject.name}-database`
  );
  const [masterUser, setMasterUser] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [engineVersion, setEngineVersion] = useState(
    LAST_POSTGRES_ENGINE_VERSION
  );
  const [instanceType, setInstanceType] = useState();

  return (
    <>
      <DashboardHeader
        image="storage"
        title="New database"
        materialIconClass="material-icons-outlined"
      />
      <ControlRow>
        <BackButton to="/databases">
          <i className="material-icons">close</i>
        </BackButton>
      </ControlRow>

      <FormWrapper>
        <InputRow
          type="string"
          label="Database name"
          value={databaseName}
          setValue={(value: string) => {
            setDatabaseName(value);
          }}
          width="100%"
        />
        <InputRow
          type="string"
          label="Master user"
          value={masterUser}
          setValue={(value: string) => {
            setMasterUser(value);
          }}
          width="100%"
        />
        <InputRow
          type="string"
          label="Master password"
          value={masterPassword}
          setValue={(value: string) => {
            setMasterPassword(value);
          }}
          width="100%"
        />
        <SelectRow
          label="Engine version"
          options={postgres_engine_versions}
          setActiveValue={(value) => {
            setEngineVersion(value);
          }}
          value={engineVersion}
          width="100%"
        />
        <SelectRow
          label="Instance type"
          options={[]}
          setActiveValue={() => {}}
          value=""
          width="100%"
        />
      </FormWrapper>
    </>
  );
};

export default CreateDatabaseForm;

const BackButton = styled(Link)`
  display: flex;
  width: 37px;
  z-index: 1;
  cursor: pointer;
  height: 37px;
  align-items: center;
  justify-content: center;
  border: 1px solid #ffffff55;
  border-radius: 100px;
  background: #ffffff11;
  text-decoration: none;
  color: white;

  > i {
    font-size: 20px;
  }

  :hover {
    background: #ffffff22;
    > img {
      opacity: 1;
    }
  }
`;

const ControlRow = styled.div`
  display: flex;
  margin-left: auto;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 35px;
  padding-left: 0px;
`;

const FormWrapper = styled.div`
  max-width: 600px;
  margin: auto;
`;
