import React from "react";
import { useRouteMatch } from "react-router";

const ExpandedJobRun = () => {
  const { params } = useRouteMatch<any>();
  console.log(params);
  return <div>{params["job_run_number"]}</div>;
};

export default ExpandedJobRun;
