import { IUserData } from "../../common/interfaces";
import { UserDataModel } from "../models/user-data-model";
import { IUserIdentity, UuUserModel } from "../models/uu-user-model";
import { JiraApiOptions } from "jira-client";

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
        this.userDataModel.setUserData(uid, userData);
    }

    public async setNotificationEmail(uid: string, email: string): Promise<void> {
        const userData = await this.userDataModel.getUserData(uid);
        userData.notificationEmail = email;
        await this.userDataModel.setUserData(uid, userData);
    }

    public isAdmin(uid: string): boolean {
        const admins = process.env.NITS_ADMIN_UIDS.trim().split(/\s*,\s*/);
        return admins.indexOf(uid) > -1;
    }
}
