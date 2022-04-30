import { AppBar, Box, Button, Container, makeStyles, Toolbar, Tooltip, Typography } from "@material-ui/core";
import EmaiIcon from "@material-ui/icons/Email";
import SyncIcon from "@material-ui/icons/Sync";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { DataContext, IDataContextValue } from "./data-context";
import { Router } from "./router";

const useStyles = makeStyles({
    leftPart: {
        display: "flex",
        alignItems: "center",
        minWidth: "100px",
    },
    mainPageLink: {
        color: "white",
        textDecoration: "none",
    },
});

interface IMainLayoutProps {
    children: React.ReactNode;
    containerSize: "xs" | "sm" | "md" | "lg" | "xl" | false;
}

export const MainLayout = (props: IMainLayoutProps) => {
    const { userData } = useContext<IDataContextValue>(DataContext);

    const classes = useStyles();
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Box flexGrow={1}>
                        <Link to={Router.PageMain} className={classes.mainPageLink}>
                            <Tooltip title="Přejít na domovskou stránku" placement="bottom-start">
                                <Typography variant="h5" className={classes.leftPart}>
                                    <img src="images/logo-title.png" height="50" />
                                </Typography>
                            </Tooltip>
                        </Link>
                    </Box>
                    {userData?.isAdmin && (
                        <>
                            <Box mr={3}>
                                <Tooltip title="Pošle měsíční e-mail uživatelům, kteří ho ještě nedostali">
                                    <Button startIcon={<EmaiIcon />} variant="contained" color="secondary" href={Router.PageMonthNotification} target="_blank">
                                        Spustit měsíční notifikaci
                                    </Button>
                                </Tooltip>
                            </Box>
                            <Box mr={3}>
                                <Button startIcon={<SyncIcon />} variant="contained" color="secondary" href={Router.PageSynchronization} target="_blank">
                                    Spustit synchronizaci
                                </Button>
                            </Box>
                        </>
                    )}
                    <Typography variant="h6" align="right">
                        {userData?.name}
                        {userData?.isAdmin ? " (admin)" : ""}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container maxWidth={props.containerSize || "sm"}>
                <Box py={3}>{props.children}</Box>
            </Container>
        </>
    );
};
