import { createTheme, ThemeProvider } from "@material-ui/core";
import React = require("react");
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { AppProvider } from "./app-provider";
import { DataProvider } from "./data-context";
import { Login } from "./login";
import { MainLayout } from "./main-layout";
import { JiraSettingsPage } from "./pages/jira-settings-page";
import { MainPage } from "./pages/main-page";
import { Router } from "./router";

const theme = createTheme({
    typography: {
        fontSize: 13,
    },
});

const pages = [Router.PageMain, Router.PageJiraSettings];

export const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <AppProvider>
                    <Switch>
                        {pages.map((path) => (
                            <Route key={path} path={path}>
                                <DataProvider>
                                    <MainLayout>
                                        {path == Router.PageMain ? <MainPage /> : ""}
                                        {path == Router.PageJiraSettings ? <JiraSettingsPage /> : ""}
                                    </MainLayout>
                                </DataProvider>
                            </Route>
                        ))}
                        <Route path="/">
                            <Login />
                        </Route>
                    </Switch>
                </AppProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
};
