import React from "react";
import DashboardHeader from "../DashboardHeader";

const DatabasesHome = () => {
  return (
    <div>
      <DashboardHeader
        image="storage"
        title="Databases"
        description="List of databases created and linked to this cluster."
        materialIconClass="material-icons-outlined"
      />
    </div>
  );
};

export default DatabasesHome;
