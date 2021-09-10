import express = require("express");
import compression from "compression";
import fs from "fs";
import os from "os";
import http from "http";
const json = require("body-parser").json;
import path = require("path");
import { Authentication } from "./modules/uu/authentication";
import { Response } from "express-serve-static-core";
import { UserRequester } from "./requesters/user-requester";
import { ProjectConfigurer } from "./project-config";
import { Crypt } from "./modules/crypt";

const projectConfig = new ProjectConfigurer().getProjectConfig();
const auth = new Authentication(projectConfig);
const crypt = new Crypt(projectConfig.cryptoSalt);
// const tokenAuthorizer = new TokenAuthorizer(crypt);
// const tokenAuthorize = tokenAuthorizer.tokenAuthorize.bind(tokenAuthorizer);
const userRequester = new UserRequester(auth, crypt, projectConfig);

const isDevelopment = os.hostname().toLowerCase() == "msi";

const app = express();
app.use(compression());
app.use(json());

if (!isDevelopment) {
    // redirect http to https
    app.use((req, res, next) => {
        if (!req.url.startsWith("/server/") && !req.secure) {
            console.log("Redirect from " + req.url);
            res.redirect("https://" + req.headers.host.replace(/:\d+$/, "") + req.url);
            res.send("");
        } else {
            next();
        }
    });
}
//TODO: BF: clean/verify

function sendError(res: Response, ex: any) {
    console.log(ex);
    res.send(
        JSON.stringify(
            {
                result: "error",
                message: ex.message,
                statusText: ex.response?.statusText,
                stack: ex.response?.data,
            },
            null,
            2
        )
    );
}

const methods: any[] = [["post", "/server/login", userRequester.login.bind(userRequester)]];

methods.forEach((method) => {
    const postOrGet = (app as any)[method[0]].bind(app);
    postOrGet(method[1], async (req: express.Request, res: express.Response) => {
        try {
            const result = await method[2](req, res);
            res.send(JSON.stringify(result));
        } catch (ex) {
            sendError(res, ex);
        }
    });
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
