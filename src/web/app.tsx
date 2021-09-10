import { Box, createTheme, ThemeProvider } from "@material-ui/core";
import React = require("react");
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { AppProvider } from "./app-provider";
import { DataProvider } from "./data-context";
import { LoggedUser } from "./logged-user";
import { Login } from "./login";
import { Router } from "./router";

const theme = createTheme({
    typography: {
        fontSize: 13,
    },
});

export const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <AppProvider>
                    <Switch>
                        <Route path={Router.PageMain}>
                            <Box m={1}>
                                <LoggedUser>
                                    <DataProvider>
                                        Some component
                                    </DataProvider>
                                </LoggedUser>
                            </Box>
                        </Route>
                        <Route path="/">
                            <Login />
                        </Route>
                    </Switch>
                </AppProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
};
