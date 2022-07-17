import React, {
  Component,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled, { keyframes } from "styled-components";
import backArrow from "assets/back_arrow.png";
import key from "assets/key.svg";
import loading from "assets/loading.gif";

import { ClusterType } from "shared/types";
import { Context } from "shared/Context";
import { isAlphanumeric } from "shared/common";
import api from "shared/api";

import TitleSection from "components/TitleSection";
import SaveButton from "components/SaveButton";
import TabRegion from "components/TabRegion";
import EnvGroupArray, { KeyValueType } from "./EnvGroupArray";
import Heading from "components/form-components/Heading";
import Helper from "components/form-components/Helper";
import InputRow from "components/form-components/InputRow";
import { withAuth, WithAuthProps } from "shared/auth/AuthorizationHoc";
import _, { remove, update } from "lodash";
import { PopulatedEnvGroup } from "components/porter-form/types";
import { isAuthorized } from "shared/auth/authorization-helpers";
import useAuth from "shared/auth/useAuth";
import { fillWithDeletedVariables } from "components/porter-form/utils";
import DynamicLink from "components/DynamicLink";
import DocsHelper from "components/DocsHelper";

type PropsType = WithAuthProps & {
  namespace: string;
  envGroup: any;
  currentCluster: ClusterType;
  closeExpanded: () => void;
};

type StateType = {
  loading: boolean;
  currentTab: string | null;
  deleting: boolean;
  saveValuesStatus: string | null;
  envGroup: EnvGroup;
  tabOptions: { value: string; label: string }[];
  newEnvGroupName: string;
};

type EnvGroup = {
  name: string;
  // timestamp: string;
  variables: KeyValueType[];
  version: number;
};

// export default withAuth(ExpandedEnvGroup);

type EditableEnvGroup = Omit<PopulatedEnvGroup, "variables"> & {
  variables: KeyValueType[];
};

export const ExpandedEnvGroupFC = ({
  envGroup,
  namespace,
  closeExpanded,
}: PropsType) => {
  const {
    currentProject,
    currentCluster,
    setCurrentOverlay,
    setCurrentError,
  } = useContext(Context);
  const [isAuthorized] = useAuth();

  const [currentTab, setCurrentTab] = useState("variables-editor");
  const [isDeleting, setIsDeleting] = useState(false);
  const [buttonStatus, setButtonStatus] = useState("");

  const [currentEnvGroup, setCurrentEnvGroup] = useState<EditableEnvGroup>(
    null
  );
  const [originalEnvVars, setOriginalEnvVars] = useState<
    {
      key: string;
      value: string;
    }[]
  >();

  const tabOptions = useMemo(() => {
    if (!isAuthorized("env_group", "", ["get", "delete"])) {
      return [{ value: "variables-editor", label: "Environment Variables" }];
    }

    if (
      !isAuthorized("env_group", "", ["get", "delete"]) &&
      currentEnvGroup?.applications?.length
    ) {
      return [
        { value: "variables-editor", label: "Environment Variables" },
        { value: "applications", label: "Linked Applications" },
      ];
    }

    if (currentEnvGroup?.applications?.length) {
      return [
        { value: "variables-editor", label: "Environment Variables" },
        { value: "applications", label: "Linked Applications" },
        { value: "settings", label: "Settings" },
      ];
    }

    return [
      { value: "variables-editor", label: "Environment Variables" },
      { value: "settings", label: "Settings" },
    ];
  }, [currentEnvGroup]);

  const populateEnvGroup = async () => {
    try {
      const populatedEnvGroup = await api
        .getEnvGroup<PopulatedEnvGroup>(
          "<token>",
          {},
          {
            name: envGroup.name,
            id: currentProject.id,
            namespace: namespace,
            cluster_id: currentCluster.id,
          }
        )
        .then((res) => res.data);
      updateEnvGroup(populatedEnvGroup);
    } catch (error) {
      console.log(error);
    }
  };

  const updateEnvGroup = (populatedEnvGroup: PopulatedEnvGroup) => {
    const variables: KeyValueType[] = Object.entries(
      populatedEnvGroup.variables || {}
    ).map(([key, value]) => ({
      key: key,
      value: value,
      hidden: value.includes("PORTERSECRET"),
      locked: value.includes("PORTERSECRET"),
      deleted: false,
    }));

    setOriginalEnvVars(
      Object.entries(populatedEnvGroup.variables || {}).map(([key, value]) => ({
        key,
        value,
      }))
    );

    setCurrentEnvGroup({
      ...populatedEnvGroup,
      variables,
    });
  };

  const handleDeleteEnvGroup = () => {
    const { name } = currentEnvGroup;

    setIsDeleting(true);
    setCurrentOverlay(null);
    api
      .deleteEnvGroup(
        "<token>",
        {
          name,
        },
        {
          id: currentProject.id,
          cluster_id: currentCluster.id,
          namespace,
        }
      )
      .then(() => {
        closeExpanded();
        setIsDeleting(true);
      })
      .catch(() => {
        setIsDeleting(true);
      });
  };

  const handleUpdateValues = async () => {
    setButtonStatus("loading");
    const name = currentEnvGroup.name;
    let variables = currentEnvGroup.variables;

    if (currentEnvGroup.meta_version === 2) {
      const secretVariables = remove(variables, (envVar) => {
        return !envVar.value.includes("PORTERSECRET") && envVar.hidden;
      }).reduce(
        (acc, variable) => ({
          ...acc,
          [variable.key]: variable.value,
        }),
        {}
      );

      const normalVariables = variables.reduce(
        (acc, variable) => ({
          ...acc,
          [variable.key]: variable.value,
        }),
        {}
      );

      try {
        const updatedEnvGroup = await api
          .updateEnvGroup<PopulatedEnvGroup>(
            "<token>",
            {
              name,
              variables: normalVariables,
              secret_variables: secretVariables,
            },
            {
              project_id: currentProject.id,
              cluster_id: currentCluster.id,
              namespace,
            }
          )
          .then((res) => res.data);
        setButtonStatus("successful");
        updateEnvGroup(updatedEnvGroup);
        setTimeout(() => setButtonStatus(""), 1000);
      } catch (error) {
        setButtonStatus("Couldn't update successfully");
        setCurrentError(error);
        setTimeout(() => setButtonStatus(""), 1000);
      }
    } else {
      // SEPARATE THE TWO KINDS OF VARIABLES
      let secret = variables.filter(
        (variable) =>
          variable.hidden && !variable.value.includes("PORTERSECRET")
      );

      let normal = variables.filter(
        (variable) =>
          !variable.hidden && !variable.value.includes("PORTERSECRET")
      );

      // Filter variables that weren't updated
      normal = normal.reduce((acc, variable) => {
        const originalVar = originalEnvVars.find(
          (orgVar) => orgVar.key === variable.key
        );

        // Remove variables that weren't updated
        if (variable.value === originalVar?.value) {
          return acc;
        }

        // add the variable that's going to be updated
        return [...acc, variable];
      }, []);

      secret = secret.reduce((acc, variable) => {
        const originalVar = originalEnvVars.find(
          (orgVar) => orgVar.key === variable.key
        );

        // Remove variables that weren't updated
        if (variable.value === originalVar?.value) {
          return acc;
        }

        // add the variable that's going to be updated
        return [...acc, variable];
      }, []);

      // Check through the original env vars to see if there's a missing variable, if it is, then means it was removed
      const removedNormal = originalEnvVars.reduce((acc, orgVar) => {
        if (orgVar.value.includes("PORTERSECRET")) {
          return acc;
        }

        const variableFound = variables.find(
          (variable) => orgVar.key === variable.key
        );
        if (variableFound) {
          return acc;
        }
        return [
          ...acc,
          {
            key: orgVar.key,
            value: null,
          },
        ];
      }, []);

      const removedSecret = originalEnvVars.reduce((acc, orgVar) => {
        if (!orgVar.value.includes("PORTERSECRET")) {
          return acc;
        }

        const variableFound = variables.find(
          (variable) => orgVar.key === variable.key
        );
        if (variableFound) {
          return acc;
        }
        return [
          ...acc,
          {
            key: orgVar.key,
            value: null,
          },
        ];
      }, []);

      normal = [...normal, ...removedNormal];
      secret = [...secret, ...removedSecret];

      const normalObject = normal.reduce((acc, val) => {
        return {
          ...acc,
          [val.key]: val.value,
        };
      }, {});

      const secretObject = secret.reduce((acc, val) => {
        return {
          ...acc,
          [val.key]: val.value,
        };
      }, {});

      // console.log({ normalObject, secretObject });

      try {
        const updatedEnvGroup = await api
          .updateConfigMap(
            "<token>",
            {
              name,
              variables: normalObject,
              secret_variables: secretObject,
            },
            {
              id: currentProject.id,
              cluster_id: currentCluster.id,
              namespace,
            }
          )
          .then((res) => res.data);
        setButtonStatus("successful");
        updateEnvGroup(updatedEnvGroup);
        setTimeout(() => setButtonStatus(""), 1000);
      } catch (error) {
        setButtonStatus("Couldn't update successfully");
        setCurrentError(error);
        setTimeout(() => setButtonStatus(""), 1000);
      }
    }
  };

  const renderTabContents = () => {
    const { variables } = currentEnvGroup;

    switch (currentTab) {
      case "variables-editor":
        return (
          <EnvGroupVariablesEditor
            onChange={(x) =>
              setCurrentEnvGroup((prev) => ({ ...prev, variables: x }))
            }
            handleUpdateValues={handleUpdateValues}
            variables={variables}
            buttonStatus={buttonStatus}
          />
        );
      case "applications":
        return <ApplicationsList envGroup={currentEnvGroup} />;
      default:
        return (
          <EnvGroupSettings
            envGroup={currentEnvGroup}
            handleDeleteEnvGroup={handleDeleteEnvGroup}
          />
        );
    }
  };

  useEffect(() => {
    populateEnvGroup();
  }, [envGroup]);

  if (!currentEnvGroup) {
    return null;
  }

  return (
    <StyledExpandedChart>
      <HeaderWrapper>
        <BackButton onClick={closeExpanded}>
          <BackButtonImg src={backArrow} />
        </BackButton>
        <TitleSection icon={key} iconWidth="33px">
          {envGroup.name}
          <TagWrapper>
            Namespace <NamespaceTag>{namespace}</NamespaceTag>
          </TagWrapper>
        </TitleSection>
      </HeaderWrapper>

      {isDeleting ? (
        <>
          <LineBreak />
          <Placeholder>
            <TextWrap>
              <Header>
                <Spinner src={loading} /> Deleting "{currentEnvGroup.name}"
              </Header>
              You will be automatically redirected after deletion is complete.
            </TextWrap>
          </Placeholder>
        </>
      ) : (
        <TabRegion
          currentTab={currentTab}
          setCurrentTab={(x: string) => setCurrentTab(x)}
          options={tabOptions}
          color={null}
        >
          {renderTabContents()}
        </TabRegion>
      )}
    </StyledExpandedChart>
  );
};

export default ExpandedEnvGroupFC;

const EnvGroupVariablesEditor = ({
  onChange,
  handleUpdateValues,
  variables,
  buttonStatus,
}: {
  variables: KeyValueType[];
  buttonStatus: any;
  onChange: (newValues: any) => void;
  handleUpdateValues: () => void;
}) => {
  const [isAuthorized] = useAuth();

  return (
    <TabWrapper>
      <InnerWrapper>
        <Heading>Environment Variables</Heading>
        <Helper>
          Set environment variables for your secrets and environment-specific
          configuration.
        </Helper>
        <EnvGroupArray
          values={variables}
          setValues={(x: any) => {
            onChange(x);
          }}
          fileUpload={true}
          secretOption={true}
          disabled={
            !isAuthorized("env_group", "", [
              "get",
              "create",
              "delete",
              "update",
            ])
          }
        />
      </InnerWrapper>
      {isAuthorized("env_group", "", ["get", "update"]) && (
        <SaveButton
          text="Update"
          onClick={() => handleUpdateValues()}
          status={buttonStatus}
          makeFlush={true}
        />
      )}
    </TabWrapper>
  );
};

const EnvGroupSettings = ({
  envGroup,
  handleDeleteEnvGroup,
}: {
  envGroup: EditableEnvGroup;
  handleDeleteEnvGroup: () => void;
}) => {
  const { setCurrentOverlay } = useContext(Context);
  const [isAuthorized] = useAuth();

  const canDelete = useMemo(() => {
    // add a case for when applications is null - in this case this is a deprecated env group version
    if (!envGroup?.applications) {
      return true;
    }

    return envGroup?.applications?.length === 0;
  }, [envGroup]);

  return (
    <TabWrapper>
      {isAuthorized("env_group", "", ["get", "delete"]) && (
        <InnerWrapper full={true}>
          {/* <Heading>Name</Heading>
                <Subtitle>
                  <Warning makeFlush={true} highlight={!isEnvGroupNameValid}>
                    Lowercase letters, numbers, and "-" only.
                  </Warning>
                </Subtitle>
                <DarkMatter antiHeight="-29px" />
                <InputRow
                  type="text"
                  value={newName}
                  setValue={(x: string) =>
                    this.setState({ newEnvGroupName: x })
                  }
                  placeholder="ex: doctor-scientist"
                  width="100%"
                />
                <Button
                  color="#616FEEcc"
                  disabled={!(isEnvGroupNameDifferent && isEnvGroupNameValid)}
                  onClick={this.handleRename}
                >
                  Rename {name}
                </Button>

                <DarkMatter /> */}

          <Heading>Manage Environment Group</Heading>
          <Helper>
            Permanently delete this set of environment variables. This action
            cannot be undone.
          </Helper>
          {!canDelete && (
            <Helper color="#f5cb42">
              Applications are still synced to this env group. Navigate to
              "Linked Applications" and remove this env group from all
              applications to delete.
            </Helper>
          )}
          {envGroup.stack_id?.length ? (
            <>
              <Helper color="#f5cb42">
                You have to delete the stack to remove this env group.
              </Helper>
              <CloneButton
                as={DynamicLink}
                color="#5561C0"
                to={`/stacks/${envGroup.namespace}/${envGroup.stack_id}`}
              >
                Go to the stack
              </CloneButton>
            </>
          ) : (
            <Button
              color="#b91133"
              onClick={() => {
                setCurrentOverlay({
                  message: `Are you sure you want to delete ${envGroup.name}?`,
                  onYes: handleDeleteEnvGroup,
                  onNo: () => setCurrentOverlay(null),
                });
              }}
              disabled={!canDelete}
            >
              Delete {envGroup.name}
            </Button>
          )}
        </InnerWrapper>
      )}
    </TabWrapper>
  );
};

const ApplicationsList = ({ envGroup }: { envGroup: EditableEnvGroup }) => {
  const { currentCluster } = useContext(Context);

  return (
    <>
      <HeadingWrapper>
        <Heading isAtTop>Linked applications:</Heading>
        <DocsHelper
          link="https://docs.porter.run/deploying-applications/environment-groups#syncing-environment-groups-to-applications"
          tooltipText="When env group sync is enabled, the applications are automatically restarted when the env groups are updated."
          placement="top-start"
          disableMargin
        />
      </HeadingWrapper>
      {envGroup.applications.map((appName) => {
        return (
          <StyledCard>
            <Flex>
              <ContentContainer>
                <EventInformation>
                  <EventName>{appName}</EventName>
                </EventInformation>
              </ContentContainer>
              <ActionContainer>
                <ActionButton
                  to={`/applications/${currentCluster.name}/${envGroup.namespace}/${appName}`}
                  target="_blank"
                >
                  <span className="material-icons-outlined">open_in_new</span>
                </ActionButton>
              </ActionContainer>
            </Flex>
          </StyledCard>
        );
      })}
    </>
  );
};

const HeadingWrapper = styled.div`
  display: flex;
  margin-bottom: 15px;
`;

const Header = styled.div`
  font-weight: 500;
  color: #aaaabb;
  font-size: 16px;
  margin-bottom: 15px;
`;

const Placeholder = styled.div`
  min-height: 400px;
  height: 50vh;
  padding: 30px;
  padding-bottom: 90px;
  font-size: 13px;
  color: #ffffff44;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.img`
  width: 15px;
  height: 15px;
  margin-right: 12px;
  margin-bottom: -2px;
`;

const TextWrap = styled.div``;

const LineBreak = styled.div`
  width: calc(100% - 0px);
  height: 2px;
  background: #ffffff20;
  margin: 15px 0px 55px;
`;

const HeaderWrapper = styled.div`
  position: relative;
`;

const BackButton = styled.div`
  position: absolute;
  top: 0px;
  right: 0px;
  display: flex;
  width: 36px;
  cursor: pointer;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid #ffffff55;
  border-radius: 100px;
  background: #ffffff11;

  :hover {
    background: #ffffff22;
    > img {
      opacity: 1;
    }
  }
`;

const BackButtonImg = styled.img`
  width: 16px;
  opacity: 0.75;
`;

const Button = styled.button`
  height: 35px;
  font-size: 13px;
  margin-top: 5px;
  margin-bottom: 30px;
  font-weight: 500;
  font-family: "Work Sans", sans-serif;
  color: white;
  padding: 6px 20px 7px 20px;
  text-align: left;
  border: 0;
  border-radius: 5px;
  background: ${(props) => (!props.disabled ? props.color : "#aaaabb")};
  box-shadow: ${(props) =>
    !props.disabled ? "0 2px 5px 0 #00000030" : "none"};
  cursor: ${(props) => (!props.disabled ? "pointer" : "default")};
  user-select: none;
  :focus {
    outline: 0;
  }
  :hover {
    filter: ${(props) => (!props.disabled ? "brightness(120%)" : "")};
  }
`;

const CloneButton = styled(Button)`
  display: flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  background-color: #ffffff11;
  :hover {
    background-color: #ffffff18;
  }
`;

const InnerWrapper = styled.div<{ full?: boolean }>`
  width: 100%;
  height: ${(props) => (props.full ? "100%" : "calc(100% - 65px)")};
  background: #ffffff11;
  padding: 0 35px;
  padding-bottom: 15px;
  position: relative;
  border-radius: 8px;
  overflow: auto;
`;

const TabWrapper = styled.div`
  height: 100%;
  width: 100%;
  padding-bottom: 65px;
  overflow: hidden;
`;

const InfoWrapper = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0px 17px 0px;
  height: 20px;
`;

const LastDeployed = styled.div`
  font-size: 13px;
  margin-left: 0;
  margin-top: -1px;
  display: flex;
  align-items: center;
  color: #aaaabb66;
`;

const TagWrapper = styled.div`
  height: 20px;
  font-size: 12px;
  display: flex;
  margin-left: 20px;
  margin-bottom: -3px;
  align-items: center;
  font-weight: 400;
  justify-content: center;
  color: #ffffff44;
  border: 1px solid #ffffff44;
  border-radius: 3px;
  padding-left: 5px;
  background: #26282e;
`;

const NamespaceTag = styled.div`
  height: 20px;
  margin-left: 6px;
  color: #aaaabb;
  background: #43454a;
  border-radius: 3px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px 6px;
  padding-left: 7px;
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
`;

const StyledExpandedChart = styled.div`
  width: 100%;
  z-index: 0;
  animation: fadeIn 0.3s;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
  display: flex;
  overflow-y: auto;
  padding-bottom: 120px;
  flex-direction: column;
  overflow: visible;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Warning = styled.span<{ highlight: boolean; makeFlush?: boolean }>`
  color: ${(props) => (props.highlight ? "#f5cb42" : "")};
  margin-left: ${(props) => (props.makeFlush ? "" : "5px")};
`;

const Subtitle = styled.div`
  padding: 11px 0px 16px;
  font-family: "Work Sans", sans-serif;
  font-size: 13px;
  color: #aaaabb;
  line-height: 1.6em;
  display: flex;
  align-items: center;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const StyledCard = styled.div`
  border-radius: 8px;
  padding: 10px 18px;
  overflow: hidden;
  font-size: 13px;
  animation: ${fadeIn} 0.5s;

  background: #2b2e3699;
  margin-bottom: 15px;
  overflow: hidden;
  border: 1px solid #ffffff0a;
`;

const Flex = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ContentContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
`;

const EventInformation = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
`;

const EventName = styled.div`
  font-family: "Work Sans", sans-serif;
  font-weight: 500;
  color: #ffffff;
`;

const ActionContainer = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  height: 100%;
`;

const ActionButton = styled(DynamicLink)`
  position: relative;
  border: none;
  background: none;
  color: white;
  padding: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  color: #aaaabb;
  border: 1px solid #ffffff00;

  :hover {
    background: #ffffff11;
    border: 1px solid #ffffff44;
  }

  > span {
    font-size: 20px;
  }
`;
