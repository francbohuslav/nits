import { IUserIdentity, UserModel } from "../models/user-model";

export class UserController {
    private authenticatedUsers: IUserIdentity[] = [];

    constructor(private userModel: UserModel) {}

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
}
