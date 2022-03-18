import { Button, LinearProgress, Typography } from "@material-ui/core";
import { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { IUserPublicData } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { thisApp } from "../app-provider";
import { Header } from "../components/header";
import { DataContext, IDataContextValue } from "../data-context";
import { Router } from "../router";
import React = require("react");
// import process from "process";

export const JiraSettingsPage = () => {
    const { projectConfig } = useContext<IDataContextValue>(DataContext);
    const [sessionHash, setSessionHash] = useState<string>(null);
    const [userData, setUserData] = useState<IUserPublicData>(null);
    const history = useHistory();
    const [isLoading, setIsLoading] = useState(false);
    const ajax = useAjax();

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<string>("/server/get-user-session");
        const res2 = await ajax.get<IUserPublicData>("/server/get-user-public-data");
        if (res.isOk) {
            setSessionHash(res.data);
        }
        if (res2.isOk) {
            setUserData(res2.data);
        }
        setIsLoading(false);
    };

    const onLogout = async () => {
        setIsLoading(true);
        const res = await ajax.post<boolean>("/server/logout-jira");
        setIsLoading(false);
        if (res.isOk) {
            thisApp().toast("Spojení s JIRA bylo zrušeno. Synchronizace nebude použita.", "warning");
            history.push(Router.PageMain);
        } else {
            thisApp().toast("Data nebyla uložena", "error");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const clientId = projectConfig?.jiraClientId;
    const server = projectConfig?.serverAddress?.replace(/\/$/, "");
    const url = sessionHash
        ? `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${encodeURIComponent(
              clientId
          )}&scope=read%3Auser%3Ajira&redirect_uri=${encodeURIComponent(server)}%2Fserver%2Fjira%2Foauth&state=${encodeURIComponent(
              sessionHash
          )}&response_type=code&prompt=consent`
        : "#";

    return (
        <Header header="JIRA propojení">
            {isLoading ? (
                <LinearProgress />
            ) : (
                <>
                    {userData?.jiraAccountId ? (
                        <>
                            <Typography variant="body1" align="center" paragraph>
                                Přihlášen jako {userData.jiraName}
                            </Typography>
                            <Typography variant="body1" align="center">
                                <Button variant="contained" color="secondary" onClick={onLogout}>
                                    Zrušit propojení s JIRA
                                </Button>{" "}
                                <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                                    Zpět
                                </Button>
                            </Typography>
                        </>
                    ) : (
                        <>
                            <Typography variant="body1" align="center" paragraph>
                                Nepřihlášen
                            </Typography>
                            <Typography variant="body1" align="center">
                                {sessionHash && (
                                    <Button variant="contained" color="primary" rel="noreferrer" href={url}>
                                        Přihlásit se do JIRA
                                    </Button>
                                )}{" "}
                                <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                                    Zpět
                                </Button>
                            </Typography>
                        </>
                    )}
                </>
            )}
        </Header>
    );
};
