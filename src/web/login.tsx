import React = require("react");
import { TextField, Button, Typography, Container, Box } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { useState } from "react";
import { Router } from "./router";
import { ILoginRequest } from "../common/ajax-interfaces";
import { thisApp } from "./app-provider";
import { useAjax } from "./ajax";

export const Login = () => {
    const [accessCodes, setAccessCodes] = useState<ILoginRequest>({ accessCode1: null, accessCode2: null });
    const history = useHistory();
    const ajax = useAjax();

    const onClick = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await ajax.post<boolean>("/server/login/", accessCodes);
        if (response.isOk) {
            history.push(Router.PageMain);
        } else {
            thisApp().alert(response.message || "Sorry bro, your access codes are wrong.");
        }
    };

    const accCode1Changed = (e: any) => setAccessCodes({ ...accessCodes, accessCode1: e.target.value });
    const accCode2Changed = (e: any) => setAccessCodes({ ...accessCodes, accessCode2: e.target.value });

    return (
        <>
            <Container maxWidth="sm" style={{ marginTop: "20vh" }}>
                <Typography component="h1" variant="h3" align="center">
                    NITS territory
                </Typography>
                <Box mt={2} my={3}>
                    <Typography component="h2" variant="h5" align="center">
                        Prove that you are worthy and enter UU credentials!
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
