import express = require("express");
import compression from "compression";
import session = require("express-session");
import fs from "fs";
import http from "http";
const json = require("body-parser").json;
import path = require("path");
import { Response } from "express-serve-static-core";
import { UserRequester } from "./requesters/user-requester";
import { ProjectConfigurer } from "./project-config";
import { Crypt } from "./helpers/crypt";
import { UserController } from "./controllers/user-controller";
import { UuIdendtityApi } from "./apis/uu-identity-api";
import { LoginAuthorizer } from "./helpers/login-authorizer";
import { UserDataModel } from "./models/user-data-model";
import { SyncRequester } from "./requesters/sync-requester";
import { SyncController } from "./controllers/sync-controller";
import { JiraModel } from "./models/jira/jira-model";
import { JiraApi } from "./apis/jira-api";
import { JiraApiOptions } from "jira-client";
import { IBaseResponse } from "../common/ajax-interfaces";
import dotenv from "dotenv";
import { ReadOnlyTimesheetModel } from "./models/uu/readonly-timesheet-model";
import { UuUserModel } from "./models/uu-user-model";
import { WtmApi } from "./apis/wtm-api";
import { JiraRequester } from "./requesters/jira-requester";
import { JiraController } from "./controllers/jira-controller";
import { ProjectRequester } from "./requesters/project-requester";
import { ProjectController } from "./controllers/project-controller";
import { ProjectDataModel } from "./models/project-data-model";
import { NotifyRequester } from "./requesters/notify-requester";
dotenv.config();

const isDevelopment = !!process.env.NITS_DEVEL_ACCOUNT;

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
const projectDataModel = new ProjectDataModel(path.join(__dirname, "../../../userdata/projects"));
const jiraApi = new JiraApi(
    {
        ...jiraConnectionSettings,
        username: process.env.NITS_JIRA_USERNAME,
        password: process.env.NITS_JIRA_API_TOKEN,
    },
    projectConfig
);
const jiraModel = new JiraModel(jiraApi, projectConfig);
const uuUserModel = new UuUserModel(new UuIdendtityApi(), {});
const userController = new UserController(uuUserModel, userDataModel, projectConfig);
const jiraController = new JiraController(userDataModel, crypt, projectConfig);
const projectController = new ProjectController(projectDataModel, jiraApi);
// Requests
const loginAuthorizer = new LoginAuthorizer(userController);
const loginAuthorize = loginAuthorizer.loginAuthorize.bind(loginAuthorizer);
const adminAuthorize = loginAuthorizer.adminAuthorize.bind(loginAuthorizer);
const userRequester = new UserRequester(userController, crypt);
const jiraRequester = new JiraRequester(jiraController, crypt);
const syncController = new SyncController(
    userDataModel,
    jiraModel,
    projectController,
    projectConfig,
    (acc1, acc2) => new ReadOnlyTimesheetModel(acc1, acc2, uuUserModel, new WtmApi())
);
const syncRequester = new SyncRequester(syncController);
const projectReqester = new ProjectRequester(projectController);
const notifyRequester = new NotifyRequester(userController);

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

const methods: IServerMethod[] = [
    m("post", "/server/login", userRequester.login.bind(userRequester)),
    m("post", "/server/logout", userRequester.logout.bind(userRequester)),
    m("get", "/server/get-user-public-data", userRequester.getUserPublicData.bind(userRequester), loginAuthorize),
    m("get", "/server/get-user-session", userRequester.getUserSession.bind(userRequester), loginAuthorize),
    m("post", "/server/logout-jira", userRequester.logoutJira.bind(userRequester), loginAuthorize),
    m("get", "/server/jira/oauth", jiraRequester.oauth.bind(jiraRequester)),
    m("get", "/server/sync", syncRequester.sync.bind(syncRequester), undefined, { formatOutput: true }),
    m("post", "/server/notify/set", notifyRequester.setNotificationEmail.bind(notifyRequester), loginAuthorize),

    // admin commands
    m("get", "/server/project-settings/get", projectReqester.getProjectSettings.bind(projectReqester), adminAuthorize),
    m("post", "/server/project-settings/set", projectReqester.setProjectSettings.bind(projectReqester), adminAuthorize),
];

const processRequest = (method: IServerAction, options: IServerMethodOptions) => async (req: express.Request, res: express.Response) => {
    try {
        const dataResult = await method(req, res);
        const result: IBaseResponse<unknown> = {
            data: dataResult,
        };
        res.send(isDevelopment || options.formatOutput ? JSON.stringify(result, null, 2) : JSON.stringify(result));
    } catch (ex) {
        sendError(res, ex);
    }
};

methods.forEach((method) => {
    const postOrGet = (app as any)[method.method].bind(app);
    if (method.authorization) {
        postOrGet(method.path, method.authorization, processRequest(method.action, method.options));
    } else {
        postOrGet(method.path, processRequest(method.action, method.options));
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

type IServerAction = (req: express.Request, res: express.Response) => any;
type IMiddleWare = (req: Request, res: Response, next: () => void) => void;
interface IServerMethodOptions {
    formatOutput?: boolean;
}

interface IServerMethod {
    method: string;
    path: string;
    action: IServerAction;
    authorization: IMiddleWare;
    options: IServerMethodOptions;
}

function m(method: string, path: string, action: IServerAction, authorization?: IMiddleWare, options?: IServerMethodOptions): IServerMethod {
    return {
        action,
        method,
        path,
        authorization,
        options: options || {},
    };
}
