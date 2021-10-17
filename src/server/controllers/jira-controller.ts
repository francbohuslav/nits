import axios from "axios";
import { IJiraProcessRequest } from "../../common/ajax-interfaces";
import dateUtils from "../../common/date-utils";
import { JiraApi } from "../apis/jira-api";
import { Crypt } from "../helpers/crypt";
import { UserDataModel } from "../models/user-data-model";
import { IProjectConfig } from "../project-config";

export class JiraController {
    constructor(private userDataModel: UserDataModel, private crypt: Crypt, private projectConfig: IProjectConfig) {}

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
        console.log("accessToken", accessToken);

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
}
