import { Box, Button, LinearProgress, TextField } from "@material-ui/core";
import { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { IUserPublicData } from "../../common/interfaces";
import { useAjax } from "../ajax";
import { thisApp } from "../app-provider";
import { Header } from "../components/header";
import { DataContext, IDataContextValue } from "../data-context";
import { Router } from "../router";
import React = require("react");

export const NotifySettingsPage = () => {
    const { projectConfig } = useContext<IDataContextValue>(DataContext);
    const [email, setEmail] = useState<string>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const ajax = useAjax();
    const history = useHistory();

    const loadData = async () => {
        setIsLoading(true);
        const res = await ajax.get<IUserPublicData>("/server/get-user-public-data");
        if (res.isOk) {
            setEmail(res.data.notificationEmail);
        }
        setIsLoading(false);
    };

    const saveData = async () => {
        setIsLoading(true);
        const res = await ajax.post<boolean>("/server/notify/set", { email });
        setIsLoading(false);
        if (res.isOk) {
            thisApp().toast("Uloženo");
            history.push(Router.PageMain);
        } else {
            thisApp().toast("Data nebyla uložena", "error");
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveData();
    };

    const onTest = async () => {
        setIsTesting(true);
        const res = await ajax.post<boolean>("/server/notify/test", { email });
        setIsTesting(false);
        if (res.isOk) {
            thisApp().toast("Odesláno");
        } else {
            thisApp().toast("Zprávu se neporařilo odeslat", "error");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <Header header="Nastavení notifikace">
            {isLoading ? (
                <LinearProgress></LinearProgress>
            ) : (
                <form noValidate onSubmit={onSubmit}>
                    <TextField
                        id="notificationEmail"
                        label="E-mail"
                        value={email}
                        type="email"
                        fullWidth
                        margin="dense"
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Box display="flex">
                        <Box flexGrow={1}>
                            {projectConfig?.emailIsActive && (
                                <>
                                    {isTesting ? (
                                        <Box pt={2} width={210}>
                                            <LinearProgress />
                                        </Box>
                                    ) : (
                                        <Button variant="contained" color="secondary" onClick={onTest}>
                                            Poslat testovací zprávu
                                        </Button>
                                    )}
                                </>
                            )}
                        </Box>
                        <Box>
                            <Button variant="contained" color="primary" type="submit">
                                Uložit
                            </Button>{" "}
                            <Button variant="contained" onClick={() => history.push(Router.PageMain)}>
                                Zpět
                            </Button>
                        </Box>
                    </Box>
                </form>
            )}
        </Header>
    );
};
