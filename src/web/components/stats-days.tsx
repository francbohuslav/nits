import React = require("react");
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, makeStyles } from "@material-ui/core";
import { DataGrid, GridColumns, GridRowData } from "@material-ui/data-grid";
import { IStats, IStatsDay, IStatsDays } from "../../common/interfaces";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import MuiAlert from "@material-ui/lab/Alert";
import dateUtils from "../../common/date-utils";

interface IInfoProps {
    days: IStatsDays;
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

    const idGetter = (row: GridRowData) => (row as IStatsDay).date;

    const columns: GridColumns = [
        {
            field: "date",
            headerName: "Datum",
            flex: 1,
            renderCell: (params) => dateUtils.formatDate(params.value as string),
        },
        {
            field: "jiraHours",
            headerName: "JIRA [hod]",
            flex: 1,
        },
        {
            field: "wtmHours",
            headerName: "WTM [hod]",
            flex: 1,
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
    const userSyncWarning = props.days && Object.values(props.days).some((r) => r.jiraHours != r.wtmHours);
    const rows = props.days ? Object.values(props.days) : [];
    rows.sort((a, b) => -a.date.localeCompare(b.date));

    return (
        <Dialog open={!!props.days} onClose={() => props.onClose()}>
            <DialogTitle>Info</DialogTitle>
            <DialogContent>
                <DialogContentText>
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
