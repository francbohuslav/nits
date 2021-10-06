import { Box, Button, Grid, Tooltip, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import React = require("react");
import EmailIcon from "@material-ui/icons/Email";
import CheckIcon from "@material-ui/icons/Check";
import InfoIcon from "@material-ui/icons/Info";
import CloseIcon from "@material-ui/icons/Close";
import SettingsIcon from "@material-ui/icons/Settings";
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import StatsIcon from "@material-ui/icons/BarChart";
import ExitIcon from "@material-ui/icons/ExitToApp";
import { useAjax } from "../ajax";
import { useHistory } from "react-router-dom";
import { Router } from "../router";
import { DataContext, IDataContextValue } from "../data-context";
import { useContext, useState } from "react";
import { Info } from "../components/info";

const useStyles = makeStyles({
    button: {
        justifyContent: "left",
    },

    greenIcon: {
        marginTop: "6px",
        color: green[600],
    },
    redIcon: {
        marginTop: "6px",
        color: red[500],
    },
    infoOpen: {
        maxHeight: "500px !important",
    },
    infoNotOpen: {
        maxHeight: 0,
        transition: "max-height 0.5s",
        overflow: "hidden",
        cursor: "pointer",
    },
});

export const MainPage = () => {
    const { isJiraOk, isAdmin, notificationEmail } = useContext<IDataContextValue>(DataContext);
    const [infoOpen, setInfoOpen] = useState(false);
    const classes = useStyles();
    const history = useHistory();
    const ajax = useAjax();

    const onJira = () => history.push(Router.PageJiraSettings);
    const onNotify = () => history.push(Router.PageNotification);
    const onProjectSetting = () => history.push(Router.PageProjectSettings);

    const onLogout = async () => {
        await ajax.post<boolean>(Router.PageLogout);
        history.push(Router.PageLogin);
    };

    return (
        <>
            <Typography variant="h5" align="center" paragraph>
                Vítejte v aplikaci Network Inventory Time Sheets (NITS)
            </Typography>
            <Typography variant="body1" align="center" paragraph>
                <img src="/images/logo.png" height="200" />
            </Typography>
            <Box mt={4} mb={1}>
                <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={3} sm={4}></Grid>
                    <Grid item xs={6} sm={4}>
                        <Button
                            className={classes.button}
                            variant="contained"
                            startIcon={<img src="/images/jira.png" height="20" width="20" />}
                            fullWidth
                            onClick={onJira}
                        >
                            JIRA
                        </Button>
                    </Grid>
                    <Grid item xs={3} sm={4}>
                        {isJiraOk ? (
                            <Tooltip title="JIRA účet je nastaven a ověřen">
                                <CheckIcon className={classes.greenIcon} />
                            </Tooltip>
                        ) : (
                            <Tooltip title="JIRA účet neobsahuje správné přihlašovací údaje">
                                <CloseIcon className={classes.redIcon} />
                            </Tooltip>
                        )}
                    </Grid>
                </Grid>
            </Box>
            <Box mb={1}>
                <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={3} sm={4}></Grid>
                    <Grid item xs={6} sm={4}>
                        <Button className={classes.button} variant="contained" startIcon={<EmailIcon />} fullWidth onClick={onNotify}>
                            Notifikace
                        </Button>
                    </Grid>
                    <Grid item xs={3} sm={4}>
                        {notificationEmail ? (
                            <Tooltip title="Notifikační e-mail je nastaven">
                                <CheckIcon className={classes.greenIcon} />
                            </Tooltip>
                        ) : (
                            <Tooltip title="Notifikační e-mail není nastaven">
                                <CloseIcon className={classes.redIcon} />
                            </Tooltip>
                        )}
                    </Grid>
                </Grid>
            </Box>
            {isAdmin && (
                <ButtonRow>
                    <Button className={classes.button} variant="contained" startIcon={<SettingsIcon />} fullWidth onClick={onProjectSetting}>
                        Nastavení
                    </Button>
                </ButtonRow>
            )}
            {isAdmin && (
                <ButtonRow>
                    <Button disabled className={classes.button} variant="contained" startIcon={<StatsIcon />} fullWidth>
                        Statistiky
                    </Button>
                </ButtonRow>
            )}
            <ButtonRow>
                <Button className={classes.button} variant="contained" startIcon={<InfoIcon />} fullWidth onClick={() => setInfoOpen(true)}>
                    Info
                </Button>
            </ButtonRow>
            <ButtonRow>
                <Button className={classes.button} variant="contained" startIcon={<ExitIcon color="error" />} fullWidth onClick={onLogout}>
                    Odhlášení
                </Button>
            </ButtonRow>
            <Info open={infoOpen} onClose={() => setInfoOpen(false)} />
        </>
    );
};

const ButtonRow: React.FC = (props: any) => (
    <Box mb={1}>
        <Grid container alignItems="center" spacing={1}>
            <Grid item xs={3} sm={4}></Grid>
            <Grid item xs={6} sm={4}>
                {props.children}
            </Grid>
        </Grid>
    </Box>
);
