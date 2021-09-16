import { UserDataModel } from "../models/user-data-model";

export class SyncController {
    constructor(private userDataModel: UserDataModel) {}

    public async sync(): Promise<void> {
        const users = await this.userDataModel.getAllValidUserData();
        console.log(users);
    }
}
