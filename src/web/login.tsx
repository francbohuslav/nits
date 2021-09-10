import React = require("react");
import { TextField, Button, Typography, Container, Box } from "@material-ui/core";
import { useHistory, useLocation } from "react-router-dom";
import { useState } from "react";
import Ajax from "./ajax";
import { IThisApp } from "./app-provider";
import { Router } from "./router";
import { ILoginRequest, ILoginResponse } from "../common/ajax-interfaces";
import loginProvider from "./login-provider";

export const Login = () => {
    const [accessCodes, setAccessCodes] = useState<ILoginRequest>({ accessCode1: null, accessCode2: null });
    const history = useHistory();
    const location = useLocation();

    const onClick = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await Ajax.post<ILoginResponse>("/server/login/", accessCodes);
        processResponse(response);
    };

    const processResponse = (response: ILoginResponse) => {
        if (response.loginToken) {
            loginProvider.login(response.loginToken);
            history.push(Router.PageMain);
        } else {
            loginProvider.logout();
            const thisApp: IThisApp = (window as any).thisApp;
            thisApp.alert(response.message || "Sorry bro, your access codes are wrong.");
        }
    };
    const accCode1Changed = (e: any) => setAccessCodes({ ...accessCodes, accessCode1: e.target.value });
    const accCode2Changed = (e: any) => setAccessCodes({ ...accessCodes, accessCode2: e.target.value });

    if (loginProvider.isLogged()) {
        history.push(Router.PageMain + location.search);
    }

    return (
        <>
            <Container maxWidth="sm" style={{ marginTop: "20vh" }}>
                <Typography component="h1" variant="h3" align="center">
                    Sprinter territory
                </Typography>
                <Box mt={2} my={3}>
                    <Typography component="h2" variant="h5" align="center">
                        Prove that you are worthy!
                    </Typography>
                </Box>
                <form noValidate onSubmit={onClick}>
                    <TextField
                        margin="normal"
                        id="accessCode1"
                        label="Access Code 1"
                        value={accessCodes.accessCode1}
                        type="password"
                        fullWidth
                        onChange={accCode1Changed}
                    />
                    <TextField
                        margin="normal"
                        id="accessCode2"
                        label="Access Code 2"
                        value={accessCodes.accessCode2}
                        type="password"
                        fullWidth
                        onChange={accCode2Changed}
                    />
                    <Box mt={2}>
                        <Typography variant="body1" align="center">
                            <Button type="submit" color="primary" variant="contained">
                                Login
                            </Button>
                        </Typography>
                    </Box>
                </form>
            </Container>
        </>
    );
};
