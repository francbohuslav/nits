import express = require("express");
import compression from "compression";
import session = require("express-session");
import fs from "fs";
import os from "os";
import http from "http";
const json = require("body-parser").json;
import path = require("path");
import { Response } from "express-serve-static-core";
import { UserRequester } from "./requesters/user-requester";
import { ProjectConfigurer } from "./project-config";
import { Crypt } from "./helpers/crypt";
import { UserController } from "./controllers/user-controller";
import { UserModel } from "./models/user-model";
import { UuIdendtityApi } from "./apis/uu-identity-api";
import { LoginAuthorizer } from "./helpers/login-authorizer";
import { UserDataModel } from "./models/user-data-model";
import { SyncRequester } from "./requesters/sync-requester";
import { SyncController } from "./controllers/sync-controller";
import { JiraModel } from "./models/jira/jira-model";
import { DummyTimesheetModel } from "./models/uu/dummy-timesheet-model";
import { JiraApi } from "./apis/jira-api";
import { JiraApiOptions } from "jira-client";
import { IBaseResponse } from "../common/ajax-interfaces";
import dotenv from "dotenv";
dotenv.config();

const isDevelopment = os.hostname().toLowerCase() == "msi";

console.log(`Using JIRA username '${process.env.NITS_JIRA_USERNAME}'`);

const jiraConnectionSettings: JiraApiOptions = {
    protocol: "https",
    host: "intelis.atlassian.net",
    apiVersion: "3",
    strictSSL: true,
};
const projectConfig = new ProjectConfigurer().getProjectConfig();
const crypt = new Crypt(projectConfig.cryptoSalt);
const userDataModel = new UserDataModel(path.join(__dirname, "../../../userdata/users"), crypt, projectConfig);
const loginAuthorizer = new LoginAuthorizer();
const loginAuthorize = loginAuthorizer.loginAuthorize.bind(loginAuthorizer);
const jiraApi = new JiraApi({
    ...jiraConnectionSettings,
    username: process.env.NITS_JIRA_USERNAME,
    password: process.env.NITS_JIRA_PASSWORD,
});
const jiraModel = new JiraModel(jiraApi);
const userController = new UserController(new UserModel(new UuIdendtityApi(), {}), userDataModel, jiraConnectionSettings);
const userRequester = new UserRequester(userController);
const syncController = new SyncController(userDataModel, jiraModel, (_acc1, _acc2) => new DummyTimesheetModel());
const syncRequester = new SyncRequester(syncController);

//TODO: BF: remove
// (() => syncController.sync())();

const app = express();
app.use(compression());
app.use(
    session({
        secret: "verySecretSession",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(json());

function sendError(res: Response, ex: any) {
    console.log(ex);
    res.status(400);
    res.send(
        JSON.stringify(
            {
                message: ex.message,
                statusText: ex.response?.statusText,
                stack: ex.response?.data || ex.stack,
            } as IBaseResponse<unknown>,
            null,
            2
        )
    );
}

const methods: any[] = [
    ["post", "/server/login", userRequester.login.bind(userRequester)],
    ["post", "/server/logout", userRequester.logout.bind(userRequester)],
    ["get", "/server/get-user-data", userRequester.getUserData.bind(userRequester), loginAuthorize],
    ["post", "/server/set-user-data", userRequester.setUserData.bind(userRequester), loginAuthorize],
    ["get", "/server/sync", syncRequester.sync.bind(syncRequester)],
];

const processRequest = (method: (req: express.Request, res: express.Response) => any) => async (req: express.Request, res: express.Response) => {
    try {
        const dataResult = await method(req, res);
        const result: IBaseResponse<unknown> = {
            data: dataResult,
        };
        res.send(isDevelopment ? JSON.stringify(result, null, 2) : JSON.stringify(result));
    } catch (ex) {
        sendError(res, ex);
    }
};

methods.forEach((method) => {
    const postOrGet = (app as any)[method[0]].bind(app);
    if (method[3]) {
        postOrGet(method[1], method[3], processRequest(method[2]));
    } else {
        postOrGet(method[1], processRequest(method[2]));
    }
});

app.get("/page/*", async (req, res) => {
    try {
        const content = fs.readFileSync(path.join(__dirname, "/../../../dist/web/index.html"), { encoding: "utf-8" });
        res.send(content);
    } catch (ex) {
        sendError(res, ex);
    }
});

app.use(express.static(__dirname + "/../../../dist/web"));
const port = process.env.PORT || 83;

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
    console.log("HTTP Server running on port " + port);
});
