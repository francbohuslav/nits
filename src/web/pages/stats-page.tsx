import { Box, Button, LinearProgress, Link, makeStyles, Paper, Tab, Tabs, Tooltip, Typography } from "@material-ui/core";
import green from "@material-ui/core/colors/green";
import { DataGrid, GridColumns, GridRowData } from "@material-ui/data-grid";
import CheckIcon from "@material-ui/icons/Check";
import EmailIcon from "@material-ui/icons/Email";
import MuiAlert from "@material-ui/lab/Alert";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import arrayUtils from "../../common/array-utils";
import dateUtils from "../../common/date-utils";
import { IStats, IStatsArt, IStatsDay, ISystemConfig } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { Header } from "../components/header";
import { StatsStatus } from "../components/stats-status";
import { Router } from "../router";
import React = require("react");

const mockData: IStats[] = require("./stats-page-mock.json");

const useStyles = makeStyles({
    level1: {
        paddingLeft: "1em",
    },
    level1Cell: {
        background: "#ffffe0",
    },
    firstRowCell: {
        boxShadow: "0px 4px 4px -4px rgba(0, 0, 0, 0.5) inset",
    },
    lastRowCell: {
        borderBottom: "1px solid gray !important",
    },
    level2: {
        paddingLeft: "2em",
        position: "absolute",
        maxWidth: "300px",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    level2Cell: {
        background: "#f6f6f6",
    },
    greenIcon: {
        marginTop: "6px",
        color: green[600],
    },
});

export const StatsPage = () => {
    const actualMonth = dateUtils.getStartOfMonth();
    const previousMonth = dateUtils.increase(actualMonth, "months", -1);
    const beforePreviousMonth = dateUtils.increase(previousMonth, "months", -1);

    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<IStats[]>([]);
    const [systemConfig, setSystemConfig] = useState<ISystemConfig>(null);
    const [selectedUser, setSelectedUser] = useState<IStats>(null);
    const [selectedDate, setSelectedDate] = useState<string>(null);
    const [selectedMonth, setSelectedMonth] = useState<Date>(actualMonth);
    const ajax = useAjax();
    const history = useHistory();
    const classes = useStyles();

    const loadData = async () => {
        setSelectedDate(null);
        setSelectedUser(null);
        setIsLoading(true);
        const res = await ajax.get<IStats[]>("/server/admin-stats/get?month=" + dateUtils.toIsoFormat(selectedMonth));
        if (res.isOk) {
            setStats(res.data);
        }
        const res2 = await ajax.get<ISystemConfig>("/server/project-settings/get-config");
        if (res2.isOk) {
            setSystemConfig(res2.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (mockData) {
            setStats(mockData);
        } else {
            loadData();
        }
    }, [selectedMonth]);

    const idGetter = (row: GridRowData) => (row as IStats).uid || (row as IStatsDay).date || (row as IStatsArt).artifact;
    const onMonthSelected = (monthShift: number) => {
        setSelectedMonth(monthShift == 0 ? actualMonth : monthShift == 1 ? previousMonth : beforePreviousMonth);
    };

    // Less then 10 seconds is equal
    const hoursEquals = (wtmHours: number, jiraHours: number) => Math.abs(jiraHours - wtmHours) * 60 * 60 < 10;

    const badUserCount = arrayUtils.sumAction(stats, (s) => (Object.values(s.days).some((d) => d.jiraHours != d.wtmHours) ? 1 : 0));

    const columns: GridColumns = [
        {
            field: "name",
            headerName: `Jméno (${stats?.length}x)`,
            flex: 1.2,
            align: "left",
            headerAlign: "center",
            valueGetter: (params) => params.row.name || params.row.date || params.row.artifact,
            renderCell: (params) =>
                params.row.uid ? (
                    Object.keys(params.row.days).length ? (
                        <Tooltip title="Zobrazit denní data">
                            <Link
                                href="#"
                                onClick={(e: any) => {
                                    e.preventDefault();
                                    if (params.row == selectedUser) {
                                        setSelectedDate(null);
                                        setSelectedUser(null);
                                    } else {
                                        setSelectedUser(params.row as IStats);
                                    }
                                }}
                            >
                                {params.value}
                            </Link>
                        </Tooltip>
                    ) : (
                        <div>{params.value}</div>
                    )
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
                    <div className={classes.level2}>{params.value ? params.value.toString().replace("ues:", "") : ""}</div>
                ),
        },
        {
            field: "jiraHours",
            headerName: `JIRA (${dateUtils.formatHours(arrayUtils.sumAction(stats, (s) => s.jiraHours))})`,
            renderCell: (params) => (params.value == undefined ? "" : dateUtils.formatHours(params.value as number)),
        },
        {
            field: "wtmHours",
            headerName: `WTM (${dateUtils.formatHours(arrayUtils.sumAction(stats, (s) => s.wtmHours))})`,
            renderCell: (params) => dateUtils.formatHours(params.value as number),
        },
        {
            field: "notification",
            headerName: `Notification`,
            renderCell: (params) => <CheckIcon className={classes.greenIcon} />,
            renderHeader: (params) => (
                <Tooltip title="Notifikace">
                    <EmailIcon />
                </Tooltip>
            ),
            flex: 0.5,
        },
        {
            field: "status",
            headerName: `Stav (${badUserCount}/${stats.length - badUserCount})`,
            type: "boolean",
            align: "center",
            headerAlign: "center",
            flex: 0.8,
            valueGetter: (params) => {
                const stats = params.row as IStats;
                if (stats.days) {
                    const days = Object.values(stats.days);
                    return !days.some((d) => !hoursEquals(d.wtmHours, d.jiraHours));
                }
                return hoursEquals(stats.wtmHours, stats.jiraHours);
            },
            renderCell: (params) => (params.row.artifact ? "" : <StatsStatus isOk={!!params.value} />),
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
    if (selectedUser) {
        rows.forEach((r) => (r.first = false));
        rows.forEach((r) => (r.last = false));
        const index = rows.findIndex((s) => s == selectedUser) + 1;
        rows.splice(index, 0, ...Object.values(selectedUser.days));
        rows[index].first = true;
        rows[index + Object.values(selectedUser.days).length - 1].last = true;
        if (selectedDate) {
            const index2 = rows.findIndex((s) => s.date == selectedDate) + 1;
            const dayStats = selectedUser.days[selectedDate];
            rows.splice(index2, 0, ...Object.values(dayStats.artifacts));
            rows[index2].first = true;
            rows[index2 + Object.values(dayStats.artifacts).length - 1].last = true;
        }
    }
    // Default sort
    stats.sort((a, b) => a.name.localeCompare(b.name));

    const userSyncWarning = stats.some((r) => !hoursEquals(r.jiraHours, r.wtmHours));
    const selectedMonthTabIndex = dateUtils.areEquals(selectedMonth, actualMonth) ? 0 : dateUtils.areEquals(selectedMonth, previousMonth) ? 1 : 2;
    return (
        <Header header="Statistiky">
            <Typography paragraph>
                {systemConfig && !systemConfig.statsUserUid && (
                    <MuiAlert variant="filled" severity="error">
                        Není nastaven uživatel pro statistiky a proto měsíční notifikační e-mail nebude odeslán!{" "}
                        <Link href={Router.PageArtifactSettings}>Nastavit</Link>.
                    </MuiAlert>
                )}
            </Typography>
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

                    <Paper square>
                        <Tabs value={selectedMonthTabIndex} indicatorColor="primary" textColor="primary" centered onChange={(e, v) => onMonthSelected(v)}>
                            <Tab label={actualMonth.toLocaleString(undefined, { month: "long" })} />
                            <Tab label={previousMonth.toLocaleString(undefined, { month: "long" })} />
                            <Tab label={beforePreviousMonth.toLocaleString(undefined, { month: "long" })} />
                        </Tabs>
                    </Paper>
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
                <Box flexGrow={1}></Box>
                <Box>
                    <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                        Zpět
                    </Button>
                </Box>
            </Box>
        </Header>
    );
};
