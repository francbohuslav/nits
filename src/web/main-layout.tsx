import { AppBar, Toolbar, Box, Typography, IconButton, makeStyles, Container, Tooltip } from "@material-ui/core";
import { useContext, useState } from "react";
import React = require("react");
import { SideMenu } from "./layout/side-menu";
import MenuIcon from "@material-ui/icons/Menu";
import TimerIcon from "@material-ui/icons/Timer";
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
}

export const MainLayout = (props: IMainLayoutProps) => {
    const [sideMenu, setSideMenu] = useState<boolean>(false);
    const { name } = useContext<IDataContextValue>(DataContext);

    const classes = useStyles();
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Box flexGrow={1}>
                        <Link to={Router.PageMain} className={classes.mainPageLink}>
                            <Tooltip title="Go to homepage" placement="bottom-start">
                                <Typography variant="h5" className={classes.alignCenter}>
                                    <TimerIcon fontSize="large" />
                                    &nbsp; NITS
                                </Typography>
                            </Tooltip>
                        </Link>
                    </Box>
                    <Box mr={2}>
                        <Typography variant="h6">{name}</Typography>
                    </Box>
                    <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setSideMenu(true)}>
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <SideMenu open={sideMenu} onClose={() => setSideMenu(false)} />
            <Container>
                <Box py={3}>{props.children}</Box>
            </Container>
        </>
    );
};
