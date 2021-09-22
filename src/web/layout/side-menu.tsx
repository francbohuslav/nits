import React = require("react");
import { Drawer, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import List from "@material-ui/core/List";
import ExitToApp from "@material-ui/icons/ExitToApp";
import { useHistory } from "react-router-dom";
import { Router } from "../router";
import SettingsIcon from "@material-ui/icons/Settings";
import { useAjax } from "../ajax";

interface ISideMenuProps {
    open: boolean;
    onClose: () => void;
}

export const SideMenu = (props: ISideMenuProps) => {
    const history = useHistory();
    const ajax = useAjax();

    const logout = async () => {
        await ajax.post<boolean>("/server/logout/");
        history.push("/");
    };

    return (
        <Drawer anchor="right" open={props.open} onClose={props.onClose}>
            <List>
                <ListItem button onClick={() => history.push(Router.PageJiraSettings)}>
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="JIRA settings" />
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
