import { Box, createTheme, ThemeProvider, Typography } from "@material-ui/core";
import React = require("react");
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import { AppProvider } from "./app-provider";
import { UserJiraSettings } from "./components/user-jira-settings";
import { DataProvider } from "./data-context";
import { Login } from "./login";
import { MainLayout } from "./main-layout";
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
                            <DataProvider>
                                <MainLayout>
                                    <Typography variant="h1">Welcome to NITS</Typography>
                                    <Typography variant="body1">
                                        The only thing you can do here is set up <Link to={Router.PageJiraSettings}>access to Jira</Link>.
                                    </Typography>
                                </MainLayout>
                            </DataProvider>
                        </Route>
                        <Route path={Router.PageJiraSettings}>
                            <DataProvider>
                                <MainLayout>
                                    <Box style={{ maxWidth: "500px" }}>
                                        <UserJiraSettings />
                                    </Box>
                                </MainLayout>
                            </DataProvider>
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
