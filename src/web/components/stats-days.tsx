import React = require("react");
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, makeStyles, Grid } from "@material-ui/core";
import { DataGrid, GridColumns, GridRowData } from "@material-ui/data-grid";
import { IStats, IStatsArt, IStatsDay } from "../../common/interfaces";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import MuiAlert from "@material-ui/lab/Alert";
import dateUtils from "../../common/date-utils";

interface IInfoProps {
    stats: IStats;
    onClose(): void;
}

const useStyles = makeStyles({
    greenIcon: {
        color: green[600],
    },
    redIcon: {
        color: red[500],
    },
});

export const StatsDays = (props: IInfoProps) => {
    const classes = useStyles();

    const days = props.stats?.days;
    const artifacts = props.stats?.artifacts;

    const daysIdGetter = (row: GridRowData) => (row as IStatsDay).date;
    const artsIdGetter = (row: GridRowData) => (row as IStatsArt).artifact;

    const dayColumns = (
        [
            {
                field: "date",
                headerName: "Datum",
                flex: 1,
                renderCell: (params) => dateUtils.formatDate(params.value as string),
                align: "left",
                headerAlign: "left",
            },
            {
                field: "jiraHours",
                headerName: "JIRA [hod]",
                flex: 1,
                renderCell: (params) => dateUtils.formatHours(params.value as number),
            },
            {
                field: "wtmHours",
                headerName: "WTM [hod]",
                flex: 1,
                renderCell: (params) => dateUtils.formatHours(params.value as number),
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
        ] as GridColumns
    ).map((c) => {
        c.flex = c.flex || 1;
        c.align = c.align || "center";
        c.headerAlign = c.headerAlign || "center";
        return c;
    });
    const artsColumns: GridColumns = [
        {
            field: "artifact",
            headerName: "Předmět",
            flex: 2,
        },
        {
            field: "wtmHours",
            headerName: "WTM [hod]",
            align: "center",
            headerAlign: "center",
            flex: 1,
            renderCell: (params) => dateUtils.formatHours(params.value as number),
        },
    ];
    const userSyncWarning = days && Object.values(days).some((r) => r.jiraHours != r.wtmHours);
    const dayRows = days ? Object.values(days) : [];
    dayRows.sort((a, b) => -a.date.localeCompare(b.date));
    const artRows = artifacts ? Object.values(artifacts) : [];
    artRows.sort((a, b) => -a.artifact.localeCompare(b.artifact));

    return (
        <Dialog open={!!days} onClose={() => props.onClose()} maxWidth="md" fullWidth>
            <DialogTitle>Info</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <Typography paragraph>
                        {userSyncWarning && (
                            <MuiAlert variant="filled" severity="warning">
                                Nesouhlasí počet synchronizovaných hodin!
                            </MuiAlert>
                        )}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <DataGrid
                                getRowId={daysIdGetter}
                                columns={dayColumns}
                                rows={dayRows}
                                density="compact"
                                autoHeight
                                disableColumnMenu
                                hideFooterPagination
                                hideFooter
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Typography paragraph>
                                <DataGrid
                                    getRowId={artsIdGetter}
                                    columns={artsColumns}
                                    rows={artRows}
                                    density="compact"
                                    autoHeight
                                    disableColumnMenu
                                    hideFooterPagination
                                    hideFooter
                                />
                            </Typography>
                            <Typography variant="body1">
                                {props.stats?.lastSynchronization
                                    ? `Poslední synchronizace proběhla ${dateUtils.formatDateTime(props.stats.lastSynchronization)}`
                                    : "Zatím nesynchronizováno"}
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => props.onClose()} color="primary" autoFocus>
                    Zavřít
                </Button>
            </DialogActions>
        </Dialog>
    );
};
