import React, { Component, useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { Context } from "shared/Context";
import {
  Route,
  RouteComponentProps,
  Switch,
  useLocation,
  useRouteMatch,
  withRouter,
} from "react-router";

import { ChartType, StorageType } from "shared/types";
import api from "shared/api";
import { useRouting } from "shared/routing";
import ExpandedJobChart from "./ExpandedJobChart";
import ExpandedChart from "./ExpandedChart";
import Loading from "components/Loading";
import PageNotFound from "components/PageNotFound";
import ExpandedJobRun from "./ExpandedJobRun";

type PropsType = {
  setSidebar: (x: boolean) => void;
  isMetricsInstalled: boolean;
};

type StateType = {
  loading: boolean;
  currentChart: ChartType;
};

// class ExpandedChartWrapper extends Component<PropsType, StateType> {
//   state = {
//     loading: true,
//     currentChart: null as ChartType,
//   };

//   // Retrieve full chart data (includes form and values)
//   getChartData = () => {
//     let { match } = this.props;
//     let { namespace, chartName } = match.params as any;
//     let { currentProject, currentCluster } = this.context;
//     if (currentProject && currentCluster) {
//       api
//         .getChart(
//           "<token>",
//           {},
//           {
//             id: currentProject.id,
//             namespace: namespace,
//             cluster_id: currentCluster.id,
//             name: chartName,
//             revision: 0,
//           }
//         )
//         .then((res) => {
//           this.setState({ currentChart: res.data, loading: false });
//         })
//         .catch((err) => {
//           console.log("err", err.response.data);
//           this.setState({ loading: false });
//         });
//     }
//   };

//   componentDidMount() {
//     this.setState({ loading: true });
//     this.getChartData();
//   }

//   render() {
//     let { setSidebar, location, match } = this.props;
//     let { baseRoute, namespace } = match.params as any;
//     let { loading, currentChart } = this.state;
//     if (loading) {
//       return (
//         <LoadingWrapper>
//           <Loading />
//         </LoadingWrapper>
//       );
//     } else if (currentChart && baseRoute === "jobs") {
//       return (
//         <ExpandedJobChart
//           namespace={namespace}
//           currentChart={currentChart}
//           currentCluster={this.context.currentCluster}
//           closeChart={() =>
//             pushFiltered(this.props, "/jobs", ["project_id"], {
//               cluster: this.context.currentCluster.name,
//               namespace: namespace,
//             })
//           }
//           setSidebar={setSidebar}
//         />
//       );
//     } else if (currentChart && baseRoute === "applications") {
//       return (
//         <ExpandedChart
//           namespace={namespace}
//           isMetricsInstalled={this.props.isMetricsInstalled}
//           currentChart={currentChart}
//           currentCluster={this.context.currentCluster}
//           closeChart={() =>
//             pushFiltered(this.props, "/applications", ["project_id"], {
//               cluster: this.context.currentCluster.name,
//               namespace: namespace,
//             })
//           }
//           setSidebar={setSidebar}
//         />
//       );
//     }
//     return <PageNotFound />;
//   }
// }

// ExpandedChartWrapper.contextType = Context;

// export default withRouter(ExpandedChartWrapper);

const ExpandedChartWrapperFC: React.FC<PropsType> = ({
  setSidebar,
  isMetricsInstalled,
}) => {
  const { currentProject, currentCluster } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChart, setCurrentChart] = useState<ChartType>(null);

  const { params, path } = useRouteMatch<{
    namespace: string;
    chartName: string;
    baseRoute: string;
  }>();
  const { pushFiltered } = useRouting();
  const { namespace, chartName, baseRoute } = params;

  useEffect(() => {
    let isSubscribed = true;
    if (currentProject && currentCluster) {
      api
        .getChart(
          "<token>",
          {},
          {
            id: currentProject.id,
            namespace: namespace,
            cluster_id: currentCluster.id,
            name: chartName,
            revision: 0,
          }
        )
        .then((res) => {
          if (!isSubscribed) {
            return;
          }
          setCurrentChart(res.data);
          setIsLoading(false);
        })
        .catch((err) => {
          if (!isSubscribed) {
            return;
          }
          console.log("err", err.response.data);
          setIsLoading(false);
        });
    }

    return () => {
      isSubscribed = false;
    };
  }, [currentProject, currentCluster]);

  if (isLoading) {
    return (
      <LoadingWrapper>
        <Loading />
      </LoadingWrapper>
    );
  } else if (currentChart && baseRoute === "jobs") {
    return (
      <Switch>
        <Route exact path={`${path}/job-run/:job_run_number`}>
          <ExpandedJobRun />
        </Route>
        <Route path={`*`}>
          <ExpandedJobChart
            namespace={namespace}
            currentChart={currentChart}
            currentCluster={currentCluster}
            closeChart={() =>
              pushFiltered("/jobs", ["project_id"], {
                cluster: currentCluster.name,
                namespace: namespace,
              })
            }
            setSidebar={setSidebar}
          />
        </Route>
      </Switch>
    );
  } else if (currentChart && baseRoute === "applications") {
    return (
      <ExpandedChart
        namespace={namespace}
        isMetricsInstalled={isMetricsInstalled}
        currentChart={currentChart}
        currentCluster={currentCluster}
        closeChart={() =>
          pushFiltered("/applications", ["project_id"], {
            cluster: currentCluster.name,
            namespace: namespace,
          })
        }
        setSidebar={setSidebar}
      />
    );
  }
  return <PageNotFound />;
};

export default ExpandedChartWrapperFC;

const LoadingWrapper = styled.div`
  width: 100%;
  height: 100%;
  margin-top: -50px;
`;
