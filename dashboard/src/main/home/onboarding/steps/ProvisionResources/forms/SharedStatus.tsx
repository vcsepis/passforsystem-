import ProvisionerStatus, {
  TFModule,
  TFResource,
  TFResourceError,
} from "components/ProvisionerStatus";
import React, { useEffect, useMemo, useState } from "react";
import api from "shared/api";
import { useWebsockets } from "shared/hooks/useWebsockets";

export const SharedStatus: React.FC<{
  setInfraStatus: (status: { hasError: boolean; description?: string }) => void;
  project_id: number;
  filter: string[];
}> = ({ setInfraStatus, project_id, filter }) => {
  const {
    newWebsocket,
    openWebsocket,
    closeWebsocket,
    closeAllWebsockets,
  } = useWebsockets();

  const [tfModules, setTFModules] = useState<TFModule[]>([]);

  // Initialize infra
  useEffect(() => {
    api.getInfra("<token>", {}, { project_id: project_id }).then((res) => {
      var matchedInfras: Map<string, any> = new Map();

      res.data.forEach((infra: any) => {
        // if filter list is empty, add infra automatically
        if (filter.length == 0) {
          matchedInfras.set(infra.kind + "-" + infra.id, infra);
        } else if (
          filter.includes(infra.kind) &&
          (matchedInfras.get(infra.Kind)?.id || 0 < infra.id)
        ) {
          matchedInfras.set(infra.kind, infra);
        }
      });

      const tmp = [...tfModules];

      // query for desired and current state, and convert to tf module
      matchedInfras.forEach((infra: any) => {
        const module: TFModule = {
          id: infra.id,
          kind: infra.kind,
          status: infra.status,
          got_desired: false,
          created_at: infra.created_at,
        };

        tmp.push(module);
      });

      setTFModules([...tmp]);

      tmp.forEach((val, index) => {
        if (val?.status != "created") {
          updateDesiredState(index, val);
          setupInfraWebsocket(val.id + "", val, index);
        }
      });
    });

    return () => {
      closeAllWebsockets();
    };
  }, []);

  useEffect(() => {
    // recompute tf module state each time, to see if infra is ready
    if (tfModules.length > 0) {
      // see if all tf modules are in a "created" state
      const hasAllModulesCreated = tfModules.every(
        (tfm) => tfm?.status === "created"
      );
      if (hasAllModulesCreated) {
        debugger;
        setInfraStatus({
          hasError: false,
        });
        return;
      }

      const hasAllModulesOnError = tfModules.every(
        (tfm) => tfm?.status === "error"
      );
      if (hasAllModulesOnError) {
        setInfraStatus({
          hasError: true,
          description: "Encountered error while provisioning",
        });
        return;
      }

      // otherwise, check that all resources in each module are provisioned. Each module
      // must have more than one resource
      let numModulesSuccessful = 0;
      let numModulesErrored = 0;
      //
      /**
       * Hay un punto en el que el numero de numModulesSuccessful sube hasta el mismo length de
       * la cantidad de modulos registrados.
       */
      for (let tfModule of tfModules) {
        debugger;
        if (tfModule.status == "created") {
          numModulesSuccessful += 1;
        } else if (tfModule.status == "error") {
          numModulesErrored += 1;
        } else {
          const hasResources =
            Array.isArray(tfModule?.resources) && tfModule.resources.length;
          const hasFinishedCreating = tfModule.status !== "creating";
          if (hasResources && hasFinishedCreating) {
            const hasAllResourcesProvisioned = tfModule.resources.every(
              (r) => r.provisioned
            );

            if (hasAllResourcesProvisioned) {
              numModulesSuccessful += 1;
            }

            // if there's a global error, or the number of resources that errored_out is
            // greater than 0, this resource is in an error state
            const hasGlobalError = !!tfModule?.global_errors?.length;

            const hasResourceWithError = tfModule.resources.find(
              (r) => r.errored?.errored_out
            );
            if (hasGlobalError || hasResourceWithError) {
              numModulesErrored += 1;
            }
          } else if (tfModule.global_errors?.length) {
            numModulesErrored += 1;
          }
        }
      }

      if (numModulesSuccessful == tfModules.length) {
        setInfraStatus({
          hasError: false,
        });
      } else if (numModulesErrored + numModulesSuccessful == tfModules.length) {
        // otherwise, if all modules are either in an error state or successful,
        // set the status to error
        setInfraStatus({
          hasError: true,
        });
      }
    } else {
      setInfraStatus(null);
    }
  }, [tfModules]);

  const updateTFModules = (
    index: number,
    addedResources: TFResource[],
    erroredResources: TFResource[],
    globalErrors: TFResourceError[],
    gotDesired?: boolean
  ) => {
    console.log(
      index,
      addedResources,
      erroredResources,
      globalErrors,
      gotDesired
    );
    setTFModules((modules) => {
      let tmpTfModules = [...(modules || [])];

      if (!tmpTfModules[index]?.resources) {
        tmpTfModules[index] = {
          resources: [],
          ...(tmpTfModules[index] || {}),
        } as TFModule;
      }

      if (!tmpTfModules[index]?.global_errors) {
        tmpTfModules[index] = {
          global_errors: [],
          ...(tmpTfModules[index] || {}),
        } as TFModule;
      }

      if (gotDesired) {
        tmpTfModules[index].got_desired = true;
      }

      let resources = tmpTfModules[index].resources;

      // construct map of tf resources addresses to indices
      let resourceAddrMap = new Map<string, number>();

      tmpTfModules[index].resources?.forEach((resource, index) => {
        resourceAddrMap.set(resource.addr, index);
      });

      for (let addedResource of addedResources) {
        // if exists, update state to provisioned
        if (resourceAddrMap.has(addedResource.addr)) {
          let currResource = resources[resourceAddrMap.get(addedResource.addr)];
          addedResource.errored = currResource.errored;
          resources[resourceAddrMap.get(addedResource.addr)] = addedResource;
        } else {
          resources.push(addedResource);
          resourceAddrMap.set(addedResource.addr, resources.length - 1);

          // if the resource is being added but there's not a desired state, re-query for the
          // desired state
          if (!tmpTfModules[index].got_desired) {
            updateDesiredState(index, tmpTfModules[index]);
          }
        }
      }

      for (let erroredResource of erroredResources) {
        // if exists, update state to provisioned
        if (resourceAddrMap.has(erroredResource.addr)) {
          resources[
            resourceAddrMap.get(erroredResource.addr)
          ] = erroredResource;
        } else {
          resources.push(erroredResource);
          resourceAddrMap.set(erroredResource.addr, resources.length - 1);
        }
      }

      tmpTfModules[index].global_errors = [
        ...tmpTfModules[index].global_errors,
        ...globalErrors,
      ];
      return tmpTfModules;
    });
  };

  const setupInfraWebsocket = (
    websocketID: string,
    module: TFModule,
    index: number
  ) => {
    let apiPath = `/api/projects/${project_id}/infras/${module.id}/logs`;

    const wsConfig = {
      onopen: () => {
        console.log(`connected to websocket: ${websocketID}`);
      },
      onmessage: (evt: MessageEvent) => {
        // parse the data
        let parsedData = JSON.parse(evt.data);

        let addedResources: TFResource[] = [];
        let erroredResources: TFResource[] = [];
        let globalErrors: TFResourceError[] = [];
        for (let streamVal of parsedData) {
          let streamValData = JSON.parse(streamVal?.Values?.data);

          switch (streamValData?.type) {
            case "apply_complete":
              addedResources.push({
                addr: streamValData?.hook?.resource?.addr,
                provisioned: true,
                errored: {
                  errored_out: false,
                },
              });

              break;
            case "diagnostic":
              if (streamValData["@level"] == "error") {
                if (streamValData?.hook?.resource?.addr != "") {
                  erroredResources.push({
                    addr: streamValData?.hook?.resource?.addr,
                    provisioned: false,
                    errored: {
                      errored_out: true,
                      error_context: streamValData["@message"],
                    },
                  });
                } else {
                  globalErrors.push({
                    errored_out: true,
                    error_context: streamValData["@message"],
                  });
                }
              }
            case "change_summary":
              if (streamValData.changes.add != 0) {
                updateDesiredState(index, module);
              }
            default:
          }
        }

        updateTFModules(index, addedResources, erroredResources, globalErrors);
      },

      onclose: () => {
        console.log(`closing websocket: ${websocketID}`);
      },

      onerror: (err: ErrorEvent) => {
        console.log(err);
        closeWebsocket(websocketID);
      },
    };

    newWebsocket(websocketID, apiPath, wsConfig);
    openWebsocket(websocketID);
  };

  const mergeCurrentAndDesired = (
    index: number,
    desired: any,
    currentMap: Map<string, string>
  ) => {
    // map desired state to list of resources
    var addedResources: TFResource[] = desired?.map((val: any) => {
      return {
        addr: val?.addr,
        provisioned: currentMap.has(val?.addr),
        errored: {
          errored_out: val?.errored?.errored_out,
          error_context: val?.errored?.error_context,
        },
      };
    });

    updateTFModules(index, addedResources, [], [], true);
  };

  const updateDesiredState = async (index: number, val: TFModule) => {
    let desiredState = null;
    let currentState = null;

    try {
      const res = await api.getInfraDesired(
        "<token>",
        {},
        { project_id, infra_id: val?.id }
      );
      desiredState = res.data;
    } catch (error) {
      console.error(error);
      return;
    }

    try {
      const res = await api.getInfraCurrent(
        "<token>",
        {},
        { project_id, infra_id: val?.id }
      );
      currentState = res.data;
    } catch (error) {
      console.error(error);
    }

    let currentMap = new Map();

    currentState?.resources?.forEach((val: any) => {
      currentMap.set(val?.type + "." + val?.name, "");
    });

    mergeCurrentAndDesired(index, desiredState, currentMap);
  };

  const sortedModules = useMemo(() => {
    const tmp = [...tfModules];
    return tmp
      .sort((a, b) => (b.id < a.id ? -1 : b.id > a.id ? 1 : 0))
      .filter((m) => m);
  }, [tfModules]);

  return (
    <>
      <ProvisionerStatus modules={sortedModules} />
    </>
  );
};
