import { AppBar, Box, Container, makeStyles, Toolbar, Tooltip, Typography } from "@material-ui/core";
import TimerIcon from "@material-ui/icons/Timer";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { DataContext, IDataContextValue } from "./data-context";
import { Router } from "./router";
import React = require("react");

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
    const { userData } = useContext<IDataContextValue>(DataContext);

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
