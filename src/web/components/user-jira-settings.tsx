import { Box, Button, LinearProgress, TextField, Typography } from "@material-ui/core";
import { ChangeEvent, useEffect, useState } from "react";
import React = require("react");
import { useHistory } from "react-router-dom";
import { IUserDataResponse } from "../../common/ajax-interfaces";
import ajax from "../ajax";
import { thisApp } from "../app-provider";
import { Router } from "../router";

export const UserJiraSettings = () => {
    const [userData, setUserData] = useState<IUserDataResponse>(null);
    const [isLoading, setIsLoading] = useState(false);
    const history = useHistory();

    const loadData = async () => {
        setIsLoading(true);
        const data = await ajax.get<IUserDataResponse>("/server/get-user-data");
        setUserData(data);
        setIsLoading(false);
    };

    const saveData = async () => {
        setIsLoading(true);
        const res = await ajax.post<string>("/server/set-user-data", userData);
        setIsLoading(false);
        if (res == "ok") {
            thisApp().toast("Credentials successfully tested and saved");
            history.push(Router.PageMain);
        } else {
            thisApp().toast("Data not saved", "error");
        }
    };

    const dataChanged = (property: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setUserData({ ...userData, [property]: e.target.value });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveData();
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <>
            {isLoading && <LinearProgress></LinearProgress>}
            {userData && (
                <div>
                    <Typography component="h1" variant="h5">
                        Jira credentials
                    </Typography>
                    <form noValidate onSubmit={onSubmit}>
                        <TextField
                            id="jiraUserName"
                            label="Username"
                            value={userData.jiraUserName}
                            fullWidth
                            margin="dense"
                            onChange={dataChanged("jiraUserName")}
                        />
                        <TextField
                            id="jiraPassword"
                            label="API token"
                            value={userData.jiraPassword}
                            type="password"
                            fullWidth
                            margin="dense"
                            onChange={dataChanged("jiraPassword")}
                        />
                        <Box mt={2}>
                            <Button type="submit" color="primary" variant="contained">
                                Save
                            </Button>
                        </Box>
                    </form>
                </div>
            )}
            {/* {JSON.stringify(userData)} */}
        </>
    );
};
