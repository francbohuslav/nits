import React = require("react");
import { Drawer, Link, ListItem, ListItemIcon, ListItemText, Tooltip } from "@material-ui/core";
import List from "@material-ui/core/List";
import ExitToApp from "@material-ui/icons/ExitToApp";
import AccessibleForwardIcon from "@material-ui/icons/AccessibleForward";
import loginProvider from "../login-provider";
import { useHistory } from "react-router-dom";

interface ISideMenuProps {
    open: boolean;
    onClose: () => void;
}

export const SideMenu = (props: ISideMenuProps) => {
    const history = useHistory();

    const logout = async () => {
        loginProvider.logout();
        history.push("/");
    };

    return (
        <Drawer anchor="right" open={props.open} onClose={props.onClose}>
            <List>
                <ListItem button>
                    <ListItemIcon>
                        <AccessibleForwardIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Tooltip title="Installs script that improves SpritMan">
                                <Link color="textPrimary" href="/scripts/sprinter-tampermoneky.user.js" underline="none">
                                    TamperMonkey for SprintMan
                                </Link>
                            </Tooltip>
                        }
                    />
                </ListItem>
                <ListItem button onClick={logout}>
                    <ListItemIcon>
                        <ExitToApp />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </Drawer>
    );
};
