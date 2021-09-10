import React = require("react");
import { Drawer, Link, ListItem, ListItemIcon, ListItemText, Tooltip } from "@material-ui/core";
import List from "@material-ui/core/List";
import ExitToApp from "@material-ui/icons/ExitToApp";
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
