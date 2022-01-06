import React from "react";
import DashboardHeader from "../DashboardHeader";
import DatabasesList from "./DatabasesList";

const DatabasesHome = () => {
  return (
    <div>
      <DashboardHeader
        image="storage"
        title="Databases"
        description="List of databases created and linked to this cluster."
        materialIconClass="material-icons-outlined"
      />
      <DatabasesList />
    </div>
  );
};

export default DatabasesHome;
