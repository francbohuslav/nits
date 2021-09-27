import { Box, Button, LinearProgress, TextField, Typography } from "@material-ui/core";
import { ChangeEvent, useEffect, useState } from "react";
import React = require("react");
import { useHistory } from "react-router-dom";
import { IUserData } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { thisApp } from "../app-provider";
import { Router } from "../router";

export const UserJiraSettings = () => {
    const [userData, setUserData] = useState<IUserData>(null);
    const [isLoading, setIsLoading] = useState(false);
    const history = useHistory();
    const ajax = useAjax();

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IUserData>("/server/get-user-data");
        if (res.isOk) {
            setUserData(res.data);
        }
        setIsLoading(false);
    };

    const saveData = async () => {
        setIsLoading(true);
        const res = await ajax.post<boolean>("/server/set-user-data", userData);
        setIsLoading(false);
        if (res.isOk) {
            if (res.data) {
                thisApp().toast("Údaje úspěšně ověřeny a uloženy");
            } else {
                thisApp().toast("Údaje nebyly vyplněny. Synchronizace nebude použita.", "warning");
            }
            history.push(Router.PageMain);
        } else {
            thisApp().toast("Data nebyla uložena", "error");
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
                    <Typography component="h1" variant="h5" paragraph>
                        JIRA údaje
                    </Typography>
                    <form noValidate onSubmit={onSubmit}>
                        <TextField
                            id="jiraUserName"
                            label="Uživatelské jméno"
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
                                Uložit
                            </Button>
                        </Box>
                    </form>
                </div>
            )}
            {/* {JSON.stringify(userData)} */}
        </>
    );
};
