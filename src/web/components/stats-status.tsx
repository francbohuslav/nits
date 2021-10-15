import React = require("react");
import { makeStyles } from "@material-ui/core";
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";

interface IStatsStatusProps {
    isOk: boolean;
}

const useStyles = makeStyles({
    icon: {
        fontSize: "1.15rem",
        fontWeight: "bold",
    },
    greenIcon: {
        color: green[600],
    },
    redIcon: {
        color: red[500],
    },
});

export const StatsStatus = (props: IStatsStatusProps) => {
    const classes = useStyles();

    return <div className={classes.icon + " " + (props.isOk ? classes.greenIcon : classes.redIcon)}>{props.isOk ? "=" : "≠"}</div>;
};
