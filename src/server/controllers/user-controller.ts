import { IUserData } from "../../common/interfaces";
import { UserDataModel } from "../models/user-data-model";
import { IUserIdentity, UserModel } from "../models/user-model";

export class UserController {
    private authenticatedUsers: IUserIdentity[] = [];

    constructor(private userModel: UserModel, private userDataModel: UserDataModel) {}

    public async getUserUid(accessCode1: string, accessCode2: string): Promise<string> {
        const userRecord = this.authenticatedUsers.filter((a) => a.accessCode1 == accessCode1 && a.accessCode2 == accessCode2)[0];
        if (userRecord) {
            return userRecord.uid;
        }
        try {
            const identity = await this.userModel.getUserIdentity(accessCode1, accessCode2);
            this.authenticatedUsers.push(identity);
            return identity.uid;
        } catch (err) {
            console.log("Auth: not worthy");
            return null;
        }
    }

    public async getUserData(uid: string): Promise<IUserData> {
        return await this.userDataModel.getUserData(uid);
    }

    public setUserData(uid: string, userData: IUserData): Promise<void> {
        return this.userDataModel.setUserData(uid, userData);
    }
}
