import { Box, Button, IconButton, LinearProgress, Tooltip } from "@material-ui/core";
import { DataGrid, GridColumns, GridRowData } from "@material-ui/data-grid";
import CircleIcon from "@material-ui/icons/FiberManualRecord";
import MuiAlert from "@material-ui/lab/Alert";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { IAllUsersResponse, IUserSetStateRequest } from "../../common/ajax-interfaces";
import dateUtils from "../../common/date-utils";
import { IStats, IUserPublicData, IUserState } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { Router } from "../router";
import React = require("react");

export const UsersPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<IUserPublicData[]>([]);
    const ajax = useAjax();
    const history = useHistory();

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IAllUsersResponse>("/server/admin-users/get");
        if (res.isOk) {
            setUsers(res.data.users);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const idGetter = (row: GridRowData) => (row as IStats).uid;

    const onChangeState = (uid: string, prevState: IUserState) => async () => {
        setIsLoading(true);
        const res = await ajax.post<IAllUsersResponse>("/server/admin-users/set-user-state", {
            uid,
            state: prevState == "readonly" ? "active" : prevState == "active" ? "disabled" : "readonly",
        } as IUserSetStateRequest);
        if (res.isOk) {
            setUsers(res.data.users);
        }
        setIsLoading(false);
    };

    const stateToColor = (state: IUserState): string => (state == "active" ? "green" : state == "readonly" ? "orange" : "red");
    const stateToTitle = (state: IUserState): string =>
        state == "active" ? "Aktivní, synchronizace se provede" : state == "readonly" ? "Jen pročtení, simulace" : "Synchronizace se neprovede";

    const columns: GridColumns = [
        {
            field: "name",
            headerName: `Jméno (${users?.length}x)`,
            flex: 1,
            align: "left",
            headerAlign: "center",
            valueGetter: (params) => params.row.name || params.row.date || params.row.artifact,
        },
        {
            field: "lastSynchronization",
            headerName: `Poslední synchronizace`,
            flex: 1,
            renderCell: (p) => (p.value ? dateUtils.formatDateTime(p.value as string) : "ani jednou"),
        },
        {
            field: "state",
            headerName: `Stav`,
            flex: 0.5,
            renderCell: (p) => (
                <Tooltip title={stateToTitle(p.value as IUserState)}>
                    <IconButton onClick={onChangeState(p.row.uid, p.value as IUserState)} style={{ color: stateToColor(p.value as IUserState) }}>
                        <CircleIcon />
                    </IconButton>
                </Tooltip>
            ),
        },
    ];

    columns.forEach((c) => {
        c.flex = c.flex || 1;
        c.align = c.align || "center";
        c.headerAlign = c.headerAlign || "center";
        c.sortable = false;
    });

    users.sort((a, b) => a.name.localeCompare(b.name));
    return (
        <>
            <Box height={3}>
                {isLoading && (
                    <>
                        <LinearProgress />
                    </>
                )}
            </Box>
            {users && users.length > 0 ? (
                <DataGrid getRowId={idGetter} columns={columns} rows={users} density="compact" autoHeight disableColumnMenu hideFooterPagination hideFooter />
            ) : (
                <MuiAlert variant="filled" severity="warning">
                    Nikdo nemá aktivní účet
                </MuiAlert>
            )}

            <Box display="flex" mt={2}>
                <Box flexGrow={1}>
                    <Button variant="contained" color="secondary" href={Router.PageSynchronization} target="_blank">
                        Spustit synchronizaci
                    </Button>
                </Box>
                <Box>
                    <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                        Zpět
                    </Button>
                </Box>
            </Box>
        </>
    );
};
