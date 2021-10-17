import { Box, Button, LinearProgress, TextField, Typography } from "@material-ui/core";
import { useEffect, useState } from "react";
import React = require("react");
import { useAjax } from "../ajax";
import { useHistory } from "react-router";
import { Router } from "../router";
import { thisApp } from "../app-provider";
import { IUserPublicData } from "../../common/interfaces";

export const NotifySettingsPage = () => {
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
        <>
            {isLoading ? (
                <LinearProgress></LinearProgress>
            ) : (
                <div>
                    <Typography component="h1" variant="h5" paragraph>
                        Nastavení notifikace
                    </Typography>
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
                                {isTesting ? (
                                    <Box pt={2} width={210}>
                                        <LinearProgress />
                                    </Box>
                                ) : (
                                    <Button variant="contained" color="secondary" onClick={onTest}>
                                        Poslat testovací zprávu
                                    </Button>
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
                </div>
            )}
        </>
    );
};
