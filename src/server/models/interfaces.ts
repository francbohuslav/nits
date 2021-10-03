export interface ISyncReport {
    log: string[];
    users: ISyncReportUser[];
}

export interface ISyncReportUser {
    uid: string;
    name: string;
    log: string[];
}
