import compression from "compression";
import dotenv from "dotenv";
import { CachedFs, DropboxFsClient } from "dropbox-fs";
import express from "express";
import { Response } from "express-serve-static-core";
import session from "express-session";
import fs from "fs";
import http from "http";
import { Container } from "injector";
import path from "path";
import { IBaseResponse } from "../common/ajax-interfaces";
import { IProjectConfigPublic, IUserData } from "../common/interfaces";
import { WtmApi, WtmError } from "./apis/wtm-api";
import { CronController } from "./controllers/cron-controller";
import { LoginAuthorizer } from "./helpers/login-authorizer";
import { UuUserModel } from "./models/uu-user-model";
import { TimesheetModelFactoryHandler } from "./models/uu/interfaces";
import { ReadOnlyTimesheetModel } from "./models/uu/readonly-timesheet-model";
import { WritableTimesheetModel } from "./models/uu/writable-timesheet-model";
import { ProjectConfigurer } from "./project-config";
import { JiraRequester } from "./requesters/jira-requester";
import { NotifyRequester } from "./requesters/notify-requester";
import { ProjectRequester } from "./requesters/project-requester";
import { StatsRequester } from "./requesters/stats-requester";
import { SyncRequester } from "./requesters/sync-requester";
import { UserRequester } from "./requesters/user-requester";
const json = require("body-parser").json;
dotenv.config();

const isDevelopment = !!process.env.NITS_DEVEL_ACCOUNT;

console.log(`Using JIRA username '${process.env.NITS_JIRA_USERNAME}'`);

const container = new Container();

const projectConfig = new ProjectConfigurer().getProjectConfig();

container.bindValue("projectConfig", projectConfig);
container.bindValue("jiraApiOptions", {
    protocol: "https",
    host: process.env.NITS_JIRA_SERVER || "intelis.atlassian.net",
    apiVersion: "3",
    strictSSL: true,
    username: process.env.NITS_JIRA_USERNAME,
    password: process.env.NITS_JIRA_API_TOKEN,
});
container.bindValue("tokenCache", {});
container.bindValue("userStorageDir", "/users");
container.bindValue("projectStorageDir", "/projects");
container.bindValue("syncStorageDir", "/syncs");

let dropboxFsClient: DropboxFsClient = null;
if (process.env.NITS_DROPBOX_TOKEN) {
    dropboxFsClient = new DropboxFsClient();
    dropboxFsClient.connect(process.env.NITS_DROPBOX_TOKEN);
}
const cachedFs = new CachedFs(dropboxFsClient, "/" + process.env.NITS_DROPBOX_FOLDER + "/userdata", path.join(__dirname, "../../../userdata"));
container.bindClassFactory(CachedFs, () => cachedFs);

const uuUserModel = container.resolveClass(UuUserModel);
const timesheetModelFactory: TimesheetModelFactoryHandler = (user: IUserData) => {
    if (user.state == "active") {
        return new WritableTimesheetModel(user.uuAccessCode1, user.uuAccessCode2, uuUserModel, new WtmApi());
    }
    return new ReadOnlyTimesheetModel(user.uuAccessCode1, user.uuAccessCode2, uuUserModel, new WtmApi());
};

container.bindValue("timesheetModelFactory", timesheetModelFactory);
container.bindValue;

const loginAuthorizer = container.resolveClass(LoginAuthorizer);
const loginAuthorize = loginAuthorizer.loginAuthorize.bind(loginAuthorizer);
const adminAuthorize = loginAuthorizer.adminAuthorize.bind(loginAuthorizer);

const userRequester = container.resolveClass(UserRequester);
const jiraRequester = container.resolveClass(JiraRequester);
const syncRequester = container.resolveClass(SyncRequester);
const projectReqester = container.resolveClass(ProjectRequester);
const notifyRequester = container.resolveClass(NotifyRequester);
const statsRequester = container.resolveClass(StatsRequester);
const cronController = container.resolveClass(CronController);

cronController.run();

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
    const errorStructure: any = {
        message: ex.message,
        statusText: ex.response?.statusText,
        stack: ex.response?.data || ex.stack,
    };
    if (ex instanceof WtmError) {
        errorStructure.additional = (ex as WtmError).response?.uuAppErrorMap;
    }
    res.send(JSON.stringify(errorStructure as IBaseResponse<unknown>, null, 2));
}

const methods: IServerMethod[] = [
    m(
        "get",
        "/server/config",
        () => {
            const ret: IProjectConfigPublic = {
                jiraClientId: projectConfig.jira?.clientId,
                serverAddress: projectConfig.serverAddress,
                emailIsActive: !!(projectConfig.email?.user && projectConfig.email?.password),
                enableArtifacts: !projectConfig.jira.nitsCustomFieldIsArtifact,
            };
            return ret;
        },
        loginAuthorize
    ),
    m("post", "/server/login", userRequester.login.bind(userRequester)),
    m("post", "/server/logout", userRequester.logout.bind(userRequester)),
    m("get", "/server/get-user-public-data", userRequester.getUserPublicData.bind(userRequester), loginAuthorize),
    m("get", "/server/get-user-session", userRequester.getUserSession.bind(userRequester), loginAuthorize),
    m("post", "/server/logout-jira", userRequester.logoutJira.bind(userRequester), loginAuthorize),
    m("get", "/server/jira/oauth", jiraRequester.oauth.bind(jiraRequester)),
    m("post", "/server/notify/set", notifyRequester.setNotificationEmail.bind(notifyRequester), loginAuthorize),
    m("post", "/server/notify/test", notifyRequester.sendTestEmail.bind(notifyRequester), loginAuthorize),
    m("get", "/server/user-stats/get", statsRequester.getUserStats.bind(statsRequester), loginAuthorize),

    // admin commands
    m("get", "/server/sync", syncRequester.sync.bind(syncRequester), adminAuthorize, { formatOutput: true }),
    m("get", "/server/list-syncs", syncRequester.getReportFilesList.bind(syncRequester), adminAuthorize, { formatOutput: true }),
    m("get", "/server/get-sync", syncRequester.getReportFile.bind(syncRequester), adminAuthorize, { formatOutput: true }),
    m("get", "/server/month-notification", notifyRequester.monthNotification.bind(notifyRequester), adminAuthorize, { formatOutput: true }),
    m("get", "/server/project-settings/get-artifacts", projectReqester.getArtifactSettings.bind(projectReqester), adminAuthorize),
    m("post", "/server/project-settings/set-artifacts", projectReqester.setArtifactSettings.bind(projectReqester), adminAuthorize),
    m("get", "/server/project-settings/get-config", projectReqester.getSystemConfig.bind(projectReqester), adminAuthorize),
    m("post", "/server/project-settings/set-config", projectReqester.setSystemConfig.bind(projectReqester), adminAuthorize),
    m("get", "/server/admin-stats/get", statsRequester.getAdminStats.bind(statsRequester), adminAuthorize),
    m("get", "/server/admin-users/get", userRequester.getAllUsers.bind(userRequester), adminAuthorize),
    m("post", "/server/admin-users/set-user-state", userRequester.setUserState.bind(userRequester), adminAuthorize),
    m("post", "/server/admin-users/set-jira-account", userRequester.setJiraAccount.bind(userRequester), adminAuthorize),
];

const processRequest = (method: IServerAction, options: IServerMethodOptions) => async (req: express.Request, res: express.Response) => {
    try {
        const dataResult = await method(req, res);
        const result: IBaseResponse<unknown> = {
            data: dataResult,
        };
        const outputData = isDevelopment || options.formatOutput ? JSON.stringify(result, null, 2) : JSON.stringify(result);
        if (res.headersSent) {
            res.end(outputData);
        } else {
            res.send(outputData);
        }
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
console.log("TimeZone", Intl.DateTimeFormat().resolvedOptions().timeZone);
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
