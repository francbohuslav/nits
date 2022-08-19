import axios from "axios";
import { Inject } from "injector";
import { IJiraProcessRequest } from "../../common/ajax-interfaces";
import dateUtils from "../../common/date-utils";
import { IJiraAccount } from "../../common/interfaces";
import { JiraApi } from "../apis/jira-api";
import { Crypt } from "../helpers/crypt";
import { JiraModel } from "../models/jira/jira-model";
import { UserDataModel } from "../models/user-data-model";
import { IProjectConfig } from "../project-config";

@Inject.Singleton
export class JiraController {
    constructor(
        private userDataModel: UserDataModel,
        private jiraModel: JiraModel,
        private crypt: Crypt,
        @Inject.Value("projectConfig") private projectConfig: IProjectConfig
    ) {}

    public async processOAth(request: IJiraProcessRequest) {
        if (request.error) {
            throw new Error(`Chyba autorizace s JIRA: ${request.error} - ${request.error_description}`);
        }
        const pattern = this.crypt.decrypt(request.state);
        const [uid, date] = pattern.split("|");
        if (date !== dateUtils.toIsoFormat()) {
            throw new Error(`Authorization expired. Pattern: ${pattern}.`);
        }
        console.log("https://auth.atlassian.com/oauth/token");
        const response = await axios.post("https://auth.atlassian.com/oauth/token", {
            grant_type: "authorization_code",
            client_id: this.projectConfig.jira.clientId,
            client_secret: this.projectConfig.jira.clientSecret,
            code: request.code,
            redirect_uri: this.projectConfig.serverAddress + "/server/jira/oauth",
        });
        const accessToken = response.data.access_token;
        console.log("accessToken", response.data);

        const jiraApi = new JiraApi(
            {
                protocol: "https",
                host: "api.atlassian.com/ex/jira/" + this.projectConfig.jira.cloudId,
                apiVersion: "3",
                strictSSL: true,
                bearer: accessToken,
            },
            this.projectConfig
        );
        console.log("Get current user");
        const account = await jiraApi.getCurrentUser();
        const userData = await this.userDataModel.getUserData(uid);

        userData.jiraAccountId = account.accountId;
        userData.jiraName = account.displayName;

        await this.userDataModel.setUserData(uid, userData);
    }

    public async getJiraAccountsUsedLastTime(): Promise<IJiraAccount[]> {
        const worklogs = await this.jiraModel.getLastWorklogs(dateUtils.substractDay(new Date(), 10), dateUtils.increaseDay(new Date()));
        const accounts: { [id: string]: IJiraAccount } = {};
        worklogs.forEach((w) => {
            if (!accounts[w.author.accountId]) {
                accounts[w.author.accountId] = {
                    id: w.author.accountId,
                    name: w.author.displayName,
                };
            }
        });
        return Object.values(accounts);
    }
}
