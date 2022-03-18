import { Request, Response } from "express";
import { Inject } from "injector";
import { IJiraProcessRequest } from "../../common/ajax-interfaces";
import { JiraController } from "../controllers/jira-controller";
import { BaseRequester } from "./base-requester";

@Inject.Singleton
export class JiraRequester extends BaseRequester {
    constructor(private jiraController: JiraController) {
        super();
    }

    public async oauth(req: Request, res: Response): Promise<any> {
        try {
            await this.jiraController.processOAth(req.query as any as IJiraProcessRequest);
            if (!res.headersSent) {
                res.redirect("/");
            }
        } catch (er) {
            if (!res.headersSent) {
                res.redirect(`/?error=1&message=${encodeURIComponent(er.message)}&stack=${er.stack}`);
            } else {
                return { message: er.message, stack: er.stack };
            }
        }
    }
}
