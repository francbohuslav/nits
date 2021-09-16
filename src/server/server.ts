import express = require("express");
import compression from "compression";
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
import { TokenAuthorizer } from "./helpers/token-authorizer";
import { UserDataModel } from "./models/user-data-model";
import { SyncRequester } from "./requesters/sync-requester";
import { SyncController } from "./controllers/sync-controller";

const isDevelopment = os.hostname().toLowerCase() == "msi";
if (isDevelopment) {
    process.env.NITS_CRYPTO_SALT = "developmentSalt";
}
const projectConfig = new ProjectConfigurer().getProjectConfig();
const crypt = new Crypt(projectConfig.cryptoSalt);
const userDataModel = new UserDataModel(path.join(__dirname, "../../../userdata/users"), crypt, projectConfig);
const userController = new UserController(new UserModel(new UuIdendtityApi(), {}), userDataModel);
const tokenAuthorizer = new TokenAuthorizer(crypt);
const tokenAuthorize = tokenAuthorizer.tokenAuthorize.bind(tokenAuthorizer);
const userRequester = new UserRequester(userController, crypt);
const syncController = new SyncController(userDataModel);
const syncRequester = new SyncRequester(syncController);

// remove
(() => syncController.sync())();

const app = express();
app.use(compression());
app.use(json());

function sendError(res: Response, ex: any) {
    console.log(ex);
    res.send(
        JSON.stringify(
            {
                result: "error",
                message: ex.message,
                statusText: ex.response?.statusText,
                stack: ex.response?.data || ex.stack,
            },
            null,
            2
        )
    );
}

const methods: any[] = [
    ["post", "/server/login", userRequester.login.bind(userRequester)],
    ["get", "/server/get-user-data", userRequester.getUserData.bind(userRequester), tokenAuthorize],
    ["post", "/server/set-user-data", userRequester.setUserData.bind(userRequester), tokenAuthorize],
    ["get", "/server/sync", syncRequester.sync.bind(syncRequester)],
];

const processRequest = (method: (req: express.Request, res: express.Response) => any) => async (req: express.Request, res: express.Response) => {
    try {
        const result = await method(req, res);
        res.send(JSON.stringify(result));
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
