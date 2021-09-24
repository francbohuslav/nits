import { IUserData } from "../../common/interfaces";
import { JiraModel } from "../models/jira/jira-model";
import { UserDataModel } from "../models/user-data-model";
import { IUserIdentity, UuUserModel } from "../models/uu-user-model";
import { JiraApiOptions } from "jira-client";
import { JiraApi } from "../apis/jira-api";

export class UserController {
    private authenticatedUsers: IUserIdentity[] = [];

    constructor(private uuUserModel: UuUserModel, private userDataModel: UserDataModel, private jiraDefaultSettings: JiraApiOptions) {}

    /**
     * @returns UID
     */
    public async login(accessCode1: string, accessCode2: string): Promise<string> {
        const userRecord = this.authenticatedUsers.filter((a) => a.accessCode1 == accessCode1 && a.accessCode2 == accessCode2)[0];
        if (userRecord) {
            return userRecord.uid;
        }
        let identity: IUserIdentity;
        try {
            identity = await this.uuUserModel.getUuUserIdentity(accessCode1, accessCode2);
        } catch (err) {
            console.log("Auth: not worthy");
            return null;
        }
        this.authenticatedUsers.push(identity);
        const userData = await this.getUserData(identity.uid);
        userData.uuAccessCode1 = accessCode1;
        userData.uuAccessCode2 = accessCode2;
        userData.name = `${identity.identity.name} ${identity.identity.surname}`;
        await this.setUserData(identity.uid, userData);
        return identity.uid;
    }

    public async getUserData(uid: string): Promise<IUserData> {
        return await this.userDataModel.getUserData(uid);
    }

    public async setUserData(uid: string, userData: IUserData): Promise<void> {
        if (userData.jiraUserName && userData.jiraPassword) {
            const jiraModel = new JiraModel(
                new JiraApi({
                    ...this.jiraDefaultSettings,
                    username: userData.jiraUserName,
                    password: userData.jiraPassword,
                })
            );
            const jiraUser = await jiraModel.getCurrentUser();
            userData.jiraAccountId = jiraUser.accountId;
        } else {
            userData.jiraAccountId = "";
        }
        return this.userDataModel.setUserData(uid, userData);
    }
}
