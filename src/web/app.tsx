import { createTheme, ThemeProvider } from "@material-ui/core";
import React = require("react");
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { AppProvider } from "./app-provider";
import { DataProvider } from "./data-context";
import { Login } from "./login";
import { MainLayout } from "./main-layout";
import { JiraSettingsPage } from "./pages/jira-settings-page";
import { MainPage } from "./pages/main-page";
import { NotifySettingsPage } from "./pages/notify-settings-page";
import { ProjectSettingsPage } from "./pages/project-settings-page";
import { StatsPage } from "./pages/stats-page";
import { Router } from "./router";

const theme = createTheme({
    typography: {
        fontSize: 13,
    },
});

const pages = {
    [Router.PageLogin]: "sm",
    [Router.PageJiraSettings]: "sm",
    [Router.PageNotification]: "sm",
    [Router.PageProjectSettings]: "md",
    [Router.PageStats]: "sm",
    [Router.PageMain]: "sm",
};

export const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <AppProvider>
                    <Switch>
                        {Object.entries(pages).map(([path, size]) => (
                            <Route key={path} path={path}>
                                {path == Router.PageLogin ? (
                                    <Login />
                                ) : (
                                    <DataProvider>
                                        <MainLayout containerSize={size as any}>
                                            {path == Router.PageMain ? <MainPage /> : ""}
                                            {path == Router.PageJiraSettings ? <JiraSettingsPage /> : ""}
                                            {path == Router.PageNotification ? <NotifySettingsPage /> : ""}
                                            {path == Router.PageProjectSettings ? <ProjectSettingsPage /> : ""}
                                            {path == Router.PageStats ? <StatsPage /> : ""}
                                        </MainLayout>
                                    </DataProvider>
                                )}
                            </Route>
                        ))}
                    </Switch>
                </AppProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
};
