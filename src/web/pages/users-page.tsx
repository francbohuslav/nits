import {
    Box,
    Button,
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    LinearProgress,
    Tooltip,
    Typography,
} from "@material-ui/core";
import green from "@material-ui/core/colors/green";
import orange from "@material-ui/core/colors/orange";
import red from "@material-ui/core/colors/red";
import { DataGrid, GridCellEditCommitParams, GridColumns, GridRowData } from "@material-ui/data-grid";
import CheckIcon from "@material-ui/icons/Check";
import CircleIcon from "@material-ui/icons/FiberManualRecord";
import WarningIcon from "@material-ui/icons/Warning";
import MuiAlert from "@material-ui/lab/Alert";
import { makeStyles } from "@material-ui/styles";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { IAllUsersResponse, IUserSetJiraAccountRequest, IUserSetStateRequest } from "../../common/ajax-interfaces";
import dateUtils from "../../common/date-utils";
import { IJiraAccount, ILastError, IStats, IUserPublicData, IUserState } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { thisApp } from "../app-provider";
import { Header } from "../components/header";
import { Router } from "../router";
import React = require("react");

const mockData: IAllUsersResponse = null; //require("./users-page-mock.json");

const useStyles = makeStyles({
    greenIcon: {
        color: green[600],
    },
    orangeIcon: {
        color: orange[600],
    },
});

export const UsersPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<IUserPublicData[]>([]);
    const [jiraAccounts, setJiraAccounts] = useState<IJiraAccount[]>([]);
    const [lastError, setLastError] = useState<ILastError>(null);
    const [userOfError, setUserOfError] = useState<string>(null);
    const ajax = useAjax();
    const history = useHistory();
    const classes = useStyles();

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
        if (mockData) {
            setUsers(mockData.users);
            setJiraAccounts(mockData.jiraAccounts || []);
        } else {
            loadData();
        }
    }, []);

    const idGetter = (row: GridRowData) => (row as IStats).uid;

    const onChangeState = (uid: string, prevState: IUserState) => async () => {
        setIsLoading(true);
        const newState = prevState == "readonly" ? "active" : prevState == "active" ? "disabled" : "readonly";
        const res = await ajax.post<boolean>("/server/admin-users/set-user-state", {
            uid,
            state: prevState == "readonly" ? "active" : prevState == "active" ? "disabled" : "readonly",
        } as IUserSetStateRequest);
        if (!res.isOk) {
            thisApp().alert("Nepodařilo se uložit režim aktivace");
        } else {
            const newUsers = [...users];
            newUsers.find((u) => u.uid == uid).state = newState;
            setUsers(newUsers);
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

    const onErrorClick = (lastError: any, userName: string) => () => {
        setLastError(lastError);
        setUserOfError(userName);
    };

    const stateToColor = (state: IUserState): string => (state == "active" ? green[600] : state == "readonly" ? orange[600] : red[600]);
    const stateToTitle = (state: IUserState): string =>
        state == "active" ? "Aktivní, synchronizace se provede" : state == "readonly" ? "Jen pročtení, simulace" : "Synchronizace se neprovede";

    const columns: GridColumns = [
        {
            field: "name",
            headerName: `Jméno (${users?.length}x)`,
            flex: 1,
            align: "left",
            headerAlign: "center",
            valueGetter: (params) => params.value,
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
            flex: 0.8,
            renderCell: (p) => {
                if (p.value) return (p.row as IUserPublicData).jiraName;

                return (
                    <Tooltip title="Dvojklikem změň">
                        <Typography style={{ color: red[600] }}>nespárován</Typography>
                    </Tooltip>
                );
            },
            editable: true,
            type: "singleSelect",
            valueOptions: jiraAccountSelectOptions,
        },
        {
            field: "state",
            headerName: `Aktivace`,
            flex: 0.6,
            renderCell: (p) => (
                <Tooltip title={stateToTitle(p.value as IUserState)}>
                    <IconButton onClick={onChangeState(p.row.uid, p.value as IUserState)} style={{ color: stateToColor(p.value as IUserState) }}>
                        <CircleIcon />
                    </IconButton>
                </Tooltip>
            ),
        },
        {
            field: "lastError",
            headerName: `Stav`,
            flex: 0.5,
            renderCell: (p) =>
                p.value ? (
                    <Tooltip title="Chyba během synchroizace! Klikni pro detail.">
                        <IconButton onClick={onErrorClick(p.row.lastError, p.row.name)}>
                            <WarningIcon className={classes.orangeIcon} />
                        </IconButton>
                    </Tooltip>
                ) : p.row.lastSynchronization ? (
                    <Tooltip title="Synchronizace proběhla bez chyby">
                        <CheckIcon className={classes.greenIcon} />
                    </Tooltip>
                ) : (
                    ""
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
    sortedUsers.sort((a, b) => (b.lastError || "").toString().localeCompare((a.lastError || "").toString()) || a.name.localeCompare(b.name));
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
                <Box flexGrow={1}></Box>
                <Box>
                    <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                        Zpět
                    </Button>
                </Box>
            </Box>
            {lastError && (
                <Dialog open onClose={() => setLastError(null)} maxWidth="md">
                    <DialogTitle id="alert-dialog-title">Poslední chyba synchronizace uživatele {userOfError}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            <Typography variant="h6" color="secondary">
                                {lastError.message}
                            </Typography>
                            {lastError.additionalData && (
                                <Box my={2}>
                                    <Card>
                                        <Box m={2}>
                                            <strong>Additional data</strong> <pre>{JSON.stringify(lastError.additionalData, null, 2)}</pre>
                                        </Box>
                                    </Card>
                                </Box>
                            )}
                            {lastError.response && (
                                <Box my={2}>
                                    <Card>
                                        <Box m={2}>
                                            <strong>response</strong> <pre>{JSON.stringify(lastError.response, null, 2)}</pre>
                                        </Box>
                                    </Card>
                                </Box>
                            )}
                            {lastError.stack && (
                                <Box my={2}>
                                    <Card>
                                        <Box m={2}>
                                            <strong>Stack</strong> <pre>{lastError.stack}</pre>
                                        </Box>
                                    </Card>
                                </Box>
                            )}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setLastError(null)} color="secondary" autoFocus>
                            Zavřít
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Header>
    );
};
