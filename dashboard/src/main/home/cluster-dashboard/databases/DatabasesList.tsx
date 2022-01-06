import CopyToClipboard from "components/CopyToClipboard";
import Table from "components/Table";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory, useLocation, useRouteMatch } from "react-router";
import { Link } from "react-router-dom";
import { Column } from "react-table";
import { Context } from "shared/Context";
import styled from "styled-components";
import { mock_database_list } from "./mock_data";

export type DatabaseObject = {
  cluster_id: number;
  project_id: number;
  instance_id: string;
  instance_name: string;
  instance_endpoint: string;
};

const DatabasesList = () => {
  const { currentCluster, currentProject } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);
  const [databases, setDatabases] = useState<DatabaseObject[]>([]);

  useEffect(() => {
    let isSubscribed = true;

    if (isSubscribed) {
      setDatabases(mock_database_list);
      setIsLoading(false);
    }

    return () => {
      isSubscribed = false;
    };
  }, [currentCluster, currentProject]);

  const columns = useMemo<Column<DatabaseObject>[]>(
    () => [
      {
        Header: "Instance id",
        accessor: "instance_id",
      },
      {
        Header: "Instance name",
        accessor: "instance_name",
      },
      {
        Header: "Instance endpoint",
        accessor: "instance_endpoint",
        Cell: ({ row }) => {
          return (
            <>
              <CopyToClipboard as={Url} text={row.original.instance_endpoint}>
                <span>{row.original.instance_endpoint}</span>
                <i className="material-icons-outlined">content_copy</i>
              </CopyToClipboard>
            </>
          );
        },
      },
    ],
    []
  );

  const data = useMemo<Array<DatabaseObject>>(() => {
    return databases;
  }, [databases]);

  return (
    <DatabasesListWrapper>
      <ControlRow>
        <Link to="provision-database">Create database</Link>
      </ControlRow>
      <StyledTableWrapper>
        <Table columns={columns} data={data} isLoading={isLoading} />
      </StyledTableWrapper>
    </DatabasesListWrapper>
  );
};

export default DatabasesList;

const DatabasesListWrapper = styled.div`
  margin-top: 35px;
`;

const StyledTableWrapper = styled.div`
  background: #26282f;
  padding: 14px;
  border-radius: 8px;
  box-shadow: 0 4px 15px 0px #00000055;
  position: relative;
  border: 2px solid #9eb4ff00;
  width: 100%;
  height: 100%;
  :not(:last-child) {
    margin-bottom: 25px;
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

const EnvironmentCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ffffff44;
  background: #ffffff08;
  margin-bottom: 5px;
  border-radius: 10px;
  padding: 14px;
  overflow: hidden;
  height: 80px;
  font-size: 13px;
  animation: fadeIn 0.5s;
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-row-gap: 20px;
  grid-template-columns: 1;
`;

const Icon = styled.img`
  width: 100%;
`;

const Url = styled.a`
  max-width: 300px;
  font-size: 13px;
  user-select: text;
  font-weight: 400;
  display: flex;
  align-items: center;
  > i {
    margin-left: 10px;
    font-size: 15px;
  }

  > span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  :hover {
    cursor: pointer;
  }
`;
