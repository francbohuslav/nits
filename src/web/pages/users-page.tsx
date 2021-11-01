import { Box, Button, IconButton, LinearProgress, Tooltip, Typography } from "@material-ui/core";
import { DataGrid, GridCellEditCommitParams, GridColumns, GridRowData } from "@material-ui/data-grid";
import CircleIcon from "@material-ui/icons/FiberManualRecord";
import MuiAlert from "@material-ui/lab/Alert";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { IAllUsersResponse, IUserSetJiraAccountRequest, IUserSetStateRequest } from "../../common/ajax-interfaces";
import dateUtils from "../../common/date-utils";
import { IJiraAccount, IStats, IUserPublicData, IUserState } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { thisApp } from "../app-provider";
import { Header } from "../components/header";
import { Router } from "../router";
import React = require("react");

export const UsersPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<IUserPublicData[]>([]);
    const [jiraAccounts, setJiraAccounts] = useState<IJiraAccount[]>([]);
    const ajax = useAjax();
    const history = useHistory();

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IAllUsersResponse>("/server/admin-users/get");
        if (res.isOk) {
            setUsers(res.data.users);
            setJiraAccounts(res.data.jiraAccounts || []);
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
    const saveJiraAccount = async (user: IUserPublicData) => {
        setIsLoading(true);
        const res = await ajax.post<void>("/server/admin-users/set-jira-account", {
            uid: user.uid,
            jiraName: user.jiraName,
            jiraAccountId: user.jiraAccountId,
        } as IUserSetJiraAccountRequest);
        if (!res.isOk) {
            thisApp().alert("Nepodařilo se uložit nastavení JIRA účtu");
        }
        setIsLoading(false);
    };

    const jiraAccountSelectOptions = jiraAccounts.map((ja) => ({
        label: ja.name,
        value: ja.id,
    }));
    users
        .filter((u) => u.jiraAccountId)
        .forEach((u) => {
            if (!jiraAccountSelectOptions.some((ja) => ja.value == u.jiraAccountId)) {
                jiraAccountSelectOptions.push({
                    label: u.jiraName,
                    value: u.jiraAccountId,
                });
            }
        });
    jiraAccountSelectOptions.sort((a, b) => a.label.localeCompare(b.label));

    const handleCellEditCommit = React.useCallback(
        ({ id, field, value }: GridCellEditCommitParams) => {
            const user = users.find((u) => u.uid == id);
            if (field == "jiraAccountId") {
                user.jiraAccountId = value as string;
                const option = jiraAccountSelectOptions.find((ja) => ja.value == value);
                if (option) {
                    user.jiraName = option.label;
                }
            }
            setUsers([...users]);
            saveJiraAccount(user);
        },
        [jiraAccountSelectOptions]
    );

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
            field: "jiraAccountId",
            headerName: `JIRA účet`,
            flex: 1,
            renderCell: (p) => {
                if (p.value) return (p.row as IUserPublicData).jiraName;

                return (
                    <Tooltip title="Dvojklikem změň">
                        <Typography color="secondary">nespárován</Typography>
                    </Tooltip>
                );
            },
            editable: true,
            type: "singleSelect",
            valueOptions: jiraAccountSelectOptions,
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

    const sortedUsers = [...users];
    sortedUsers.sort((a, b) => a.name.localeCompare(b.name));
    return (
        <Header header="Uživatelé">
            <Box height={3}>
                {isLoading && (
                    <>
                        <LinearProgress />
                    </>
                )}
            </Box>
            {sortedUsers && sortedUsers.length > 0 ? (
                <DataGrid
                    getRowId={idGetter}
                    columns={columns}
                    rows={sortedUsers}
                    density="compact"
                    onCellEditCommit={handleCellEditCommit}
                    autoHeight
                    disableColumnMenu
                    hideFooterPagination
                    hideFooter
                />
            ) : (
                !isLoading && (
                    <MuiAlert variant="filled" severity="warning">
                        Nikdo nemá aktivní účet
                    </MuiAlert>
                )
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
        </Header>
    );
};
