import { Box, Button, LinearProgress, Link, makeStyles, Tooltip, Typography } from "@material-ui/core";
import { DataGrid, GridColumns, GridRowData } from "@material-ui/data-grid";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import { useEffect, useState } from "react";
import React = require("react");
import { IStats } from "../../common/interfaces";
import { useAjax } from "../ajax";
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import MuiAlert from "@material-ui/lab/Alert";
import { StatsDays } from "../components/stats-days";
import { Router } from "../router";
import { useHistory } from "react-router-dom";

const useStyles = makeStyles({
    greenIcon: {
        color: green[600],
    },
    redIcon: {
        color: red[500],
    },
});

export const StatsPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<IStats[]>([]);
    const [showDays, setShowDays] = useState<IStats>(null);
    const ajax = useAjax();
    const classes = useStyles();
    const history = useHistory();

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IStats[]>("/server/admin-stats/get");
        if (res.isOk) {
            setStats(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const idGetter = (row: GridRowData) => (row as IStats).uid;

    const columns: GridColumns = [
        {
            field: "name",
            headerName: "Jméno",
            flex: 1.5,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => (
                <Tooltip title="Zobrazit denní data">
                    <Link
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowDays(params.row as IStats);
                        }}
                    >
                        {params.value}
                    </Link>
                </Tooltip>
            ),
        },
        {
            field: "jiraHours",
            headerName: "JIRA [hod]",
        },
        {
            field: "wtmHours",
            headerName: "WTM [hod]",
        },
        {
            field: "status",
            headerName: " ",
            type: "boolean",
            flex: 0.4,
            valueGetter: (params) => {
                const stats = params.row as IStats;
                return stats.jiraHours == stats.wtmHours;
            },
            renderCell: (params) => (params.value ? <CheckIcon className={classes.greenIcon} /> : <CloseIcon className={classes.redIcon} />),
        },
    ];

    columns.forEach((c) => {
        c.flex = c.flex || 1;
        c.align = c.align || "center";
        c.headerAlign = c.headerAlign || "center";
    });

    // Default sort
    stats.sort((a, b) => a.name.localeCompare(b.name));

    const userSyncWarning = stats.some((r) => r.jiraHours != r.wtmHours);

    return (
        <>
            {isLoading ? (
                <LinearProgress />
            ) : (
                <>
                    <Typography paragraph>
                        {userSyncWarning && (
                            <MuiAlert variant="filled" severity="warning">
                                Některým uživatelům nesouhlasí počet synchronizovaných hodin!
                            </MuiAlert>
                        )}
                    </Typography>
                    <DataGrid
                        getRowId={idGetter}
                        columns={columns}
                        rows={stats}
                        density="compact"
                        autoHeight
                        disableColumnMenu
                        hideFooterPagination
                        hideFooter
                    />
                </>
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
            <StatsDays stats={showDays} onClose={() => setShowDays(null)} />
        </>
    );
};
