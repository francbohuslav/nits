import { Box, Button, Grid, Tooltip, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import React = require("react");
import EmailIcon from "@material-ui/icons/Email";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import SettingsIcon from "@material-ui/icons/Settings";
import StatsIcon from "@material-ui/icons/BarChart";
import ExitIcon from "@material-ui/icons/ExitToApp";
import { useAjax } from "../ajax";
import { useHistory } from "react-router-dom";
import { Router } from "../router";
import { DataContext, IDataContextValue } from "../data-context";
import { useContext } from "react";

const useStyles = makeStyles({
    img: {
        maxWidth: "100%",
    },
    button: {
        justifyContent: "left",
    },

    greenIcon: {
        marginTop: "6px",
        color: "green",
    },
    redIcon: {
        marginTop: "6px",
        color: "red",
    },
});

export const MainPage = () => {
    const { isJiraOk, isAdmin, notificationEmail } = useContext<IDataContextValue>(DataContext);
    const classes = useStyles();
    const history = useHistory();
    const ajax = useAjax();

    const onJira = () => history.push(Router.PageJiraSettings);
    const onNotify = () => history.push(Router.PageNotification);
    const onProjectSetting = () => history.push(Router.PageProjectSettings);

    const onLogout = async () => {
        await ajax.post<boolean>(Router.PageLogout);
        history.push("/");
    };

    return (
        <>
            <Typography variant="body1" paragraph>
                <img className={classes.img} src="https://source.unsplash.com/random/600x300" />
            </Typography>
            <Typography variant="h6" align="center" paragraph>
                Vítejte v aplikaci Network Inventory Time Sheets (NITS)
            </Typography>
            <Typography variant="body1" align="left" paragraph>
                Tato aplikace propojuje zajišťuje automatické propisy výkazů z JIRA do WTM. K propisu dochází každý den v noci, přičemž zpracovány jsou výkazy
                vždy 7 dní zpětně.
            </Typography>
            <Typography variant="body1" align="left" paragraph>
                Existující položky ve WTM jsou mazány a přepsány novými údaji, nejsou však ovlivněny výkazy, které jsou ve WTM zadané mimo projekty JIRA (např.
                dovolené, pohovory apod).
            </Typography>
            <Typography variant="body1" align="left" paragraph>
                Výkazy JIRA jsou ve WTM agregovány do 1-2 bloků a propojeny s definovaným artefaktem. V případě konfliktu výkazu nebo chyby je uživatel
                notifikován e-mailem.
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
                <Button className={classes.button} variant="contained" startIcon={<ExitIcon color="secondary" />} fullWidth onClick={onLogout}>
                    Odhlášení
                </Button>
            </ButtonRow>
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
