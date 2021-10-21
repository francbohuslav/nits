import { AppBar, Toolbar, Box, Typography, makeStyles, Container, Tooltip } from "@material-ui/core";
import { useContext } from "react";
import React = require("react");
import TimerIcon from "@material-ui/icons/Timer";
import WarningIcon from "@material-ui/icons/Warning";
import { DataContext, IDataContextValue } from "./data-context";
import { Link } from "react-router-dom";
import { Router } from "./router";

const useStyles = makeStyles({
    alignCenter: {
        display: "flex",
        alignItems: "center",
        marginRight: "2em",
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
    const { userData, projectConfig } = useContext<IDataContextValue>(DataContext);

    const classes = useStyles();
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Box flexGrow={1}>
                        <Link to={Router.PageMain} className={classes.mainPageLink}>
                            <Tooltip title="Přejít na domovskou stránku" placement="bottom-start">
                                <Typography variant="h5" className={classes.alignCenter}>
                                    <TimerIcon fontSize="large" />
                                    &nbsp; NITS
                                </Typography>
                            </Tooltip>
                        </Link>
                    </Box>
                    {projectConfig?.dryRun && (
                        <Box mr={4}>
                            <Tooltip title="Během synchronizace nebudou provedeny žádné změny do WTM ani JIRA">
                                <Typography variant="h6" color="error">
                                    <WarningIcon style={{ verticalAlign: "middle" }} /> <span style={{ verticalAlign: "middle" }}>Readonly režim</span>
                                </Typography>
                            </Tooltip>
                        </Box>
                    )}
                    <Typography variant="h6">
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
