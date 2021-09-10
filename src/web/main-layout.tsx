import { AppBar, Toolbar, Box, Typography, IconButton, makeStyles } from "@material-ui/core";
import { useState } from "react";
import React = require("react");
import { SideMenu } from "./layout/side-menu";
import MenuIcon from "@material-ui/icons/Menu";
import TimerIcon from "@material-ui/icons/Timer";

const useStyles = makeStyles({
    alignCenter: {
        display: "flex",
        alignItems: "center",
        marginRight: "2em",
    },
});

export const MainLayout = () => {
    const [sideMenu, setSideMenu] = useState<boolean>(false);

    const classes = useStyles();
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Box flexGrow={1}>
                        <Typography variant="h5" className={classes.alignCenter}>
                            <TimerIcon fontSize="large" />
                            &nbsp; NITS
                        </Typography>
                    </Box>
                    <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setSideMenu(true)}>
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <SideMenu open={sideMenu} onClose={() => setSideMenu(false)} />
        </>
    );
};
