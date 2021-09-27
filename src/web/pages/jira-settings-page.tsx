import { Box } from "@material-ui/core";
import React = require("react");
import { UserJiraSettings } from "../components/user-jira-settings";

export const JiraSettingsPage = () => {
    return (
        <Box style={{ maxWidth: "500px" }}>
            <UserJiraSettings />
        </Box>
    );
};
