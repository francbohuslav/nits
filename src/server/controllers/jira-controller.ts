import axios from "axios";
import { JiraApiOptions } from "jira-client";
import dateUtils from "../../common/date-utils";
import { JiraApi } from "../apis/jira-api";
import { Crypt } from "../helpers/crypt";
import { UserDataModel } from "../models/user-data-model";

export class JiraController {
    constructor(private userDataModel: UserDataModel, private crypt: Crypt, private jiraConnectionSettings: JiraApiOptions) {}

    public async processOAth(uid: string, jiraAuthorizationCode: string, state: string) {
        const pattern = this.crypt.decrypt(state);
        const [sUid, date] = pattern.split("|");
        if (date !== dateUtils.toIsoFormat()) {
            throw new Error(`Authorization expired. Pattern: ${pattern}.`);
        }
        if (uid !== sUid) {
            throw new Error(`This authorization is not for currently logged user ${uid}. Pattern: ${pattern}.`);
        }
        console.log("https://auth.atlassian.com/oauth/token");
        const response = await axios.post("https://auth.atlassian.com/oauth/token", {
            grant_type: "authorization_code",
            client_id: process.env.NITS_JIRA_CLIENT_ID,
            client_secret: process.env.NITS_JIRA_SECRET,
            code: jiraAuthorizationCode,
            redirect_uri: "https://nits-beta.herokuapp.com/server/jira/oauth",
        });
        const accessToken = response.data.access_token;
        console.log("accessToken", accessToken);

        const jiraApi = new JiraApi({
            protocol: "https",
            host: "api.atlassian.com/ex/jira/15ab9731-71ff-4f9a-86ee-91d06e58fa50",
            apiVersion: "3",
            strictSSL: true,
            bearer: accessToken,
        });
        console.log("Get current user");
        const account = await jiraApi.getCurrentUser();

        const userData = await this.userDataModel.getUserData(uid);
        userData.jiraAccountId = account.accountId;
        userData.jiraName = account.displayName;

        await this.userDataModel.setUserData(uid, userData);
    }
}
