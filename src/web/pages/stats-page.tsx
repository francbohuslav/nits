import { Box, Button, LinearProgress, Link, makeStyles, Tooltip, Typography } from "@material-ui/core";
import { DataGrid, GridColumns, GridRowData } from "@material-ui/data-grid";
import { useEffect, useState } from "react";
import React = require("react");
import { IStats, IStatsArt, IStatsDay } from "../../common/interfaces";
import { useAjax } from "../ajax";
import MuiAlert from "@material-ui/lab/Alert";
import { Router } from "../router";
import { useHistory } from "react-router-dom";
import dateUtils from "../../common/date-utils";
import { StatsStatus } from "../components/stats-status";

const mockData: IStats[] = [
    {
        uid: "12-8835-1",
        name: "Franc Bohuslav",
        jiraHours: 9.083333333333334,
        wtmHours: 9.083333333333334,
        days: {
            "2021-09-16": {
                date: "2021-09-16",
                jiraHours: 0,
                wtmHours: 1,
                artifacts: {},
            },
            "2021-09-17": {
                date: "2021-09-17",
                jiraHours: 2,
                wtmHours: 1,
                artifacts: {},
            },
            "2021-09-24": {
                date: "2021-09-24",
                jiraHours: 2.0833333333333335,
                wtmHours: 2.0833333333333335,
                artifacts: {},
            },
            "2021-10-04": {
                date: "2021-10-04",
                jiraHours: 1.5,
                wtmHours: 1.5,
                artifacts: {},
            },
            "2021-10-08": {
                date: "2021-10-08",
                jiraHours: 2.5,
                wtmHours: 2.5,
                artifacts: {},
            },
            "2021-10-14": {
                date: "2021-10-14",
                jiraHours: 1,
                wtmHours: 1,
                artifacts: {},
            },
            "2019-07-29": {
                date: "2019-07-29",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/19": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/19",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-07-30": {
                date: "2019-07-30",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/19": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/19",
                        wtmHours: 0.5,
                    },
                },
            },
            "2019-07-31": {
                date: "2019-07-31",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 1.25,
                    },
                },
            },
            "2019-08-01": {
                date: "2019-08-01",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-08-05": {
                date: "2019-08-05",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-08-06": {
                date: "2019-08-06",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 1.25,
                    },
                },
            },
            "2019-08-12": {
                date: "2019-08-12",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-08-15": {
                date: "2019-08-15",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-08-14": {
                date: "2019-08-14",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.25,
                    },
                },
            },
        },
        lastSynchronization: "2021-10-15T13:46:42.853Z",
    },
    {
        uid: "12-8835-2",
        name: "Franta vonasek",
        jiraHours: 10.083333333333334,
        wtmHours: 10.083333333333334,
        days: {
            "2021-09-16": {
                date: "2021-09-16",
                jiraHours: 1,
                wtmHours: 1,
                artifacts: {},
            },
            "2021-09-17": {
                date: "2021-09-17",
                jiraHours: 2,
                wtmHours: 2,
                artifacts: {},
            },
            "2021-09-24": {
                date: "2021-09-24",
                jiraHours: 2.0833333333333335,
                wtmHours: 2.0833333333333335,
                artifacts: {},
            },
            "2021-10-04": {
                date: "2021-10-04",
                jiraHours: 1.5,
                wtmHours: 1.5,
                artifacts: {},
            },
            "2021-10-08": {
                date: "2021-10-08",
                jiraHours: 2.5,
                wtmHours: 2.5,
                artifacts: {},
            },
            "2021-10-14": {
                date: "2021-10-14",
                jiraHours: 1,
                wtmHours: 1,
                artifacts: {},
            },
            "2019-07-29": {
                date: "2019-07-29",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/19": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/19",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-07-30": {
                date: "2019-07-30",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/19": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/19",
                        wtmHours: 0.5,
                    },
                },
            },
            "2019-07-31": {
                date: "2019-07-31",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 1.25,
                    },
                },
            },
            "2019-08-01": {
                date: "2019-08-01",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-08-05": {
                date: "2019-08-05",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-08-06": {
                date: "2019-08-06",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 1.25,
                    },
                },
            },
            "2019-08-12": {
                date: "2019-08-12",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-08-15": {
                date: "2019-08-15",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.75,
                    },
                },
            },
            "2019-08-14": {
                date: "2019-08-14",
                jiraHours: 0,
                wtmHours: 0,
                artifacts: {
                    "ues:UNI-BT:SWF.D1.DAMAS-62/08/20": {
                        artifact: "ues:UNI-BT:SWF.D1.DAMAS-62/08/20",
                        wtmHours: 0.25,
                    },
                },
            },
        },
        lastSynchronization: "2021-10-15T13:46:42.853Z",
    },
];

const useStyles = makeStyles({
    level1: {
        paddingLeft: "1em",
    },
    level1Cell: {
        background: "#fffff6",
    },
    firstRowCell: {
        boxShadow: "0px 4px 4px -4px rgba(0, 0, 0, 0.5) inset",
    },
    lastRowCell: {
        borderBottom: "1px solid gray !important",
    },
    level2: {
        paddingLeft: "2em",
    },
    level2Cell: {
        background: "#fffff0",
    },
});

export const StatsPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<IStats[]>([]);
    const [showDays, setShowDays] = useState<IStats>(null);
    const [selectedDate, setSelectedDate] = useState<string>(null);
    const ajax = useAjax();
    const history = useHistory();
    const classes = useStyles();

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IStats[]>("/server/admin-stats/get");
        if (res.isOk) {
            setStats(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        //loadData();
        setStats(mockData);
    }, []);

    const idGetter = (row: GridRowData) => {
        console.log(row);
        return (row as IStats).uid || (row as IStatsDay).date || (row as IStatsArt).artifact;
    };

    const columns: GridColumns = [
        {
            field: "name",
            headerName: "Jméno",
            flex: 1.5,
            align: "left",
            headerAlign: "center",
            valueGetter: (params) => params.row.name || params.row.date || params.row.artifact,
            renderCell: (params) =>
                params.row.uid ? (
                    <Tooltip title="Zobrazit denní data">
                        <Link
                            href="#"
                            onClick={(e: any) => {
                                e.preventDefault();
                                if (params.row == showDays) {
                                    setSelectedDate(null);
                                    setShowDays(null);
                                } else {
                                    setShowDays(params.row as IStats);
                                }
                            }}
                        >
                            {params.value}
                        </Link>
                    </Tooltip>
                ) : params.row.date ? (
                    Object.keys(params.row.artifacts).length ? (
                        <Tooltip title="Zobrazit artefakty">
                            <div className={classes.level1}>
                                <Link
                                    href="#"
                                    onClick={(e: any) => {
                                        e.preventDefault();
                                        if (params.value == selectedDate) {
                                            setSelectedDate(null);
                                        } else {
                                            setSelectedDate(params.value as string);
                                        }
                                    }}
                                >
                                    {dateUtils.formatDate(params.value as string)}
                                </Link>
                            </div>
                        </Tooltip>
                    ) : (
                        <div className={classes.level1}>{dateUtils.formatDate(params.value as string)}</div>
                    )
                ) : (
                    <div className={classes.level2}>{params.value}</div>
                ),
        },
        {
            field: "jiraHours",
            headerName: "JIRA [hod]",
            renderCell: (params) => (params.value == undefined ? "" : dateUtils.formatHours(params.value as number)),
        },
        {
            field: "wtmHours",
            headerName: "WTM [hod]",
            renderCell: (params) => dateUtils.formatHours(params.value as number),
        },
        {
            field: "status",
            headerName: "Stav",
            type: "boolean",
            align: "center",
            headerAlign: "center",
            flex: 1,
            valueGetter: (params) => {
                const stats = params.row as IStats;
                if (stats.days) {
                    const days = Object.values(stats.days);
                    return !days.some((d) => d.jiraHours != d.wtmHours);
                }
                return stats.jiraHours == stats.wtmHours;
            },
            renderCell: (params) => <StatsStatus isOk={!!params.value} />,
        },
    ];

    columns.forEach((c) => {
        c.flex = c.flex || 1;
        c.align = c.align || "center";
        c.headerAlign = c.headerAlign || "center";
        c.sortable = false;
        c.cellClassName = (params) =>
            (params.row.date ? classes.level1Cell : "") +
            " " +
            (params.row.artifact ? classes.level2Cell : "") +
            " " +
            (params.row.first ? classes.firstRowCell : "") +
            " " +
            (params.row.last ? classes.lastRowCell : "");
    });

    const rows: any[] = [...stats];
    if (showDays) {
        rows.forEach((r) => (r.first = false));
        rows.forEach((r) => (r.last = false));
        const index = rows.findIndex((s) => s == showDays) + 1;
        rows.splice(index, 0, ...Object.values(showDays.days));
        rows[index].first = true;
        rows[index + Object.values(showDays.days).length - 1].last = true;
        if (selectedDate) {
            const index2 = rows.findIndex((s) => s.date == selectedDate) + 1;
            const dayStats = showDays.days[selectedDate];
            rows.splice(index2, 0, ...Object.values(dayStats.artifacts));
            rows[index2].first = true;
            rows[index2 + Object.values(dayStats.artifacts).length - 1].last = true;
        }
    }
    // Default sort
    stats.sort((a, b) => a.name.localeCompare(b.name));

    const userSyncWarning = stats.some((r) => r.jiraHours != r.wtmHours);

    return (
        <>
            {isLoading ? (
                <>
                    <Typography paragraph>Dat bývá hodně, zabere to necelou minutku.</Typography>
                    <LinearProgress />
                </>
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
                        rows={rows}
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
        </>
    );
};
