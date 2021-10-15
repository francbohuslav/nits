interface IUserDataBase {
    jiraAccountId: string;
    jiraName: string;
    uid: string;
    name: string;
    notificationEmail: string;
    lastSynchronization: string;
}

export interface IUserPublicData extends IUserDataBase {
    isAdmin: boolean;
}

export interface IUserData extends IUserDataBase {
    uuAccessCode1: string;
    uuAccessCode2: string;
}

export interface IProjectSettings {
    jiraProjectKey: string;
    jiraNitsField: string;
    wtmArtifact: string;
}

export interface IStats {
    uid: string;
    name: string;
    jiraHours: number;
    wtmHours: number;
    days: IStatsDays;
    artifacts: IStatsArts;
    lastSynchronization: string;
}

export type IStatsDays = { [date: string]: IStatsDay };
export type IStatsArts = { [art: string]: IStatsArt };

export interface IStatsDay {
    date: string;
    jiraHours: number;
    wtmHours: number;
}

export interface IStatsArt {
    artifact: string;
    wtmHours: number;
}

export interface IUserStats {
    wtmHours: number;
    lastSynchronization: string;
}
