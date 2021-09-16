import { IUserData } from "../../../common/interfaces";

export interface IJiraModel {
    getLastUserWorklogs(userData: IUserData): Promise<Worklog[]>;
}

export class Worklog {
    public toString(): string {
        //TODO: BF: dodat nejakou identifikac
        return "JIRA Worklog";
    }
}
