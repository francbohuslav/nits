import { createTheme, ThemeProvider } from "@material-ui/core";
import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { AppProvider } from "./app-provider";
import { DataProvider } from "./data-context";
import { Login } from "./login";
import { MainLayout } from "./main-layout";
import { JiraSettingsPage } from "./pages/jira-settings-page";
import { MainPage } from "./pages/main-page";
import { NotifySettingsPage } from "./pages/notify-settings-page";
import { ProjectSettingsPage } from "./pages/project-settings-page";
import { StatsPage } from "./pages/stats-page";
import { UsersPage } from "./pages/users-page";
import { Router } from "./router";

const theme = createTheme({
    typography: {
        fontSize: 13,
    },
    overrides: {
        MuiButton: {
            contained: {
                color: "rgb(78,78,78)",
            },
        },
        MuiTooltip: {
            tooltip: {
                fontSize: "0.85em",
            },
        },
    },
});

const pages = {
    [Router.PageLogin]: "sm",
    [Router.PageJiraSettings]: "sm",
    [Router.PageNotification]: "sm",
    [Router.PageArtifactSettings]: "md",
    [Router.PageStats]: "sm",
    [Router.PageUsers]: "sm",
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
                                            {path == Router.PageArtifactSettings ? <ProjectSettingsPage /> : ""}
                                            {path == Router.PageStats ? <StatsPage /> : ""}
                                            {path == Router.PageUsers ? <UsersPage /> : ""}
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
