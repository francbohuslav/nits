import { IUserData } from "../../../common/interfaces";
import { IJiraModel, Worklog } from "./interfaces";

export class JiraModel implements IJiraModel {
    public async getLastUserWorklogs(userData: IUserData): Promise<Worklog[]> {
        console.log(`Fetching Jira worlogs of user ${userData.name}`);
        return [{}, {}, {}];
    }
}
