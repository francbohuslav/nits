import { Request, Response } from "express";
import { IJiraProcessRequest } from "../../common/ajax-interfaces";
import { JiraController } from "../controllers/jira-controller";
import { BaseRequester } from "./base-requester";

export class JiraRequester extends BaseRequester {
    constructor(private jiraController: JiraController) {
        super();
    }

    public async oauth(req: Request, res: Response): Promise<void> {
        try {
            await this.jiraController.processOAth(req.query as any as IJiraProcessRequest);
            res.redirect("/");
        } catch (er) {
            res.redirect(`/?error=1&message=${encodeURIComponent(er.message)}&stack=${er.stack}`);
        }
    }
}
