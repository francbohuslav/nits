import { Request, Response } from "express";
import { IJiraProcessRequest } from "../../common/ajax-interfaces";
import { JiraController } from "../controllers/jira-controller";
import { Crypt } from "../helpers/crypt";
import { BaseRequester } from "./base-requester";

export class JiraRequester extends BaseRequester {
    constructor(private jiraController: JiraController, private crypt: Crypt) {
        super();
    }

    public async oauth(req: Request, res: Response): Promise<void> {
        await this.jiraController.processOAth(req.query as any as IJiraProcessRequest);
        res.redirect("/page/main/");
    }
}
