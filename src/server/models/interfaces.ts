import { Worklog } from "./jira/interfaces";

export interface ISyncReport {
  startedAt: Date;
  timeZone: string;
  log: string[];
  users: ISyncReportUser[];
  worklogsOutOfTime: string[];
}

export interface ISyncReportUser {
  uid: string;
  name: string;
  log: any[];
}
export class TimesheetMapping {
  public jiraIssueKey: string;
  public date: string;
  public spentSeconds: number;
  public jiraWorklogs: Worklog[];
  public description: string;
  public wtmArtifact: string;

  public toString(): string {
    return `Timesheet mapping ${this.date} ${this.spentSeconds / 3600}h ${this.jiraIssueKey}`;
  }
}
export type TimesheetMappingsPerDay = { [day: string]: TimesheetMapping[] };
