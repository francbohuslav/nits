import { Inject } from "injector";
import { IUserData, IUserPublicData } from "../../common/interfaces";
import { SystemDataModel } from "../models/system-data-model";
import { UserDataModel } from "../models/user-data-model";
import { IUserIdentity, UuUserModel } from "../models/uu-user-model";
import { IProjectConfig } from "../project-config";

@Inject.Singleton
export class UserController {
    private authenticatedUsers: IUserIdentity[] = [];

    constructor(
        private uuUserModel: UuUserModel,
        private userDataModel: UserDataModel,
        private systemDataModel: SystemDataModel,
        @Inject.Value("projectConfig") private projectConfig: IProjectConfig
    ) {}

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
        userData.name = `${identity.identity.surname} ${identity.identity.name}`;
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

    public async getAdmins(): Promise<string[]> {
        const systemConfig = await this.systemDataModel.getSystemConfig();
        return systemConfig.adminUids;
    }

    public getAllUsers(): Promise<IUserData[]> {
        return this.userDataModel.getAllValidUserData();
    }

    public convertToPublicData(userData: IUserData, admins: string[]): IUserPublicData {
        return {
            jiraAccountId: userData.jiraAccountId,
            jiraName: userData.jiraName,
            name: userData.name,
            uid: userData.uid,
            notificationEmail: userData.notificationEmail,
            lastSynchronization: userData.lastSynchronization,
            isAdmin: admins.includes(userData.uid),
            state: userData.state,
        };
    }
}
