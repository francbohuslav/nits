import { IProjectSettings } from "../src/common/interfaces";
import { IWtmTsConfigPerWorklogId, SyncController } from "../src/server/controllers/sync-controller";
import { ISyncReport, TimesheetMapping } from "../src/server/models/interfaces";
import { IIssue, Worklog } from "../src/server/models/jira/interfaces";
import { Timesheet } from "../src/server/models/uu/interfaces";

test("filterWorklogsAndAssignWtmConfig", async () => {
    const NITS_FIELD_VALUE_1 = "1";
    const NITS_FIELD_VALUE_2 = "2";
    const NITS_FIELD_UNKNOWN_VALUE = "3";
    const projectController = {
        async getProjectSettings(): Promise<IProjectSettings[]> {
            return [
                {
                    jiraProjectKey: "CET",
                    jiraNitsField: "",
                    wtmArtifact: "CET-WITHOUT-FIELD",
                },
                {
                    jiraProjectKey: "CET",
                    jiraNitsField: NITS_FIELD_VALUE_1,
                    wtmArtifact: "CET-WITH-NITS-1",
                },
                {
                    jiraProjectKey: "CET",
                    jiraNitsField: NITS_FIELD_VALUE_2,
                    wtmArtifact: "CET-WITH-NITS-2",
                },
                {
                    jiraProjectKey: "SUP",
                    jiraNitsField: NITS_FIELD_VALUE_1,
                    wtmArtifact: "CET-WITH-NITS-3",
                },
            ];
        },
    } as any;

    const jiraModel = {
        async getIssuesById(ids: string[]): Promise<IIssue[]> {
            const issues: { [id: string]: IIssue } = {
                "1": {
                    id: "1",
                    fields: {
                        project: {
                            id: "100",
                            key: "CET",
                            name: "CET",
                        },
                    },
                    key: "CET-1",
                },
                "2": {
                    id: "2",
                    fields: {
                        project: {
                            id: "100",
                            key: "CET",
                            name: "CET",
                        },
                        nitsCustomFiled: {
                            id: NITS_FIELD_VALUE_1,
                            value: "NITS_FIELD_VALUE_1",
                        },
                    },
                    key: "CET-2",
                },
                "3": {
                    id: "3",
                    fields: {
                        project: {
                            id: "100",
                            key: "CET",
                            name: "CET",
                        },
                        nitsCustomFiled: {
                            id: NITS_FIELD_VALUE_2,
                            value: "NITS_FIELD_VALUE_2",
                        },
                    },
                    key: "CET-3",
                },
                "4": {
                    id: "4",
                    fields: {
                        project: {
                            id: "100",
                            key: "CET",
                            name: "CET",
                        },
                        nitsCustomFiled: {
                            id: NITS_FIELD_UNKNOWN_VALUE,
                            value: "NITS_FIELD_UNKNOWN_VALUE",
                        },
                    },
                    key: "CET-4",
                },
                // will not be used
                "5": {
                    id: "5",
                    fields: {
                        project: {
                            id: "200",
                            key: "OUT",
                            name: "OUT",
                        },
                    },
                    key: "OUT-4",
                },
                // configuration not fit
                "6": {
                    id: "6",
                    fields: {
                        project: {
                            id: "300",
                            key: "SUP",
                            name: "SUP",
                        },
                    },
                    key: "SUP-6",
                },
            };
            return ids.map((id) => issues[id]);
        },
    } as any;

    const syncController = new TestingSyncController(
        null,
        jiraModel,
        projectController,
        {
            admins: [],
            cryptoSalt: "test",
            jira: {
                clientId: "",
                clientSecret: "",
                cloudId: "",
                nitsCustomField: "nitsCustomFiled",
            },
            userDataEncrypted: false,
        },
        null
    );
    const inputWorklogs: Worklog[] = [
        {
            id: "10",
            issueId: "1",
        } as any,
        {
            id: "20",
            issueId: "2",
        } as any,
        {
            id: "30",
            issueId: "3",
        } as any,
        {
            id: "40",
            issueId: "4",
        } as any,
        {
            id: "50",
            issueId: "5",
        } as any,
        {
            id: "60",
            issueId: "6",
        } as any,
    ];
    const wtmTsConfigPerWorklogs: IWtmTsConfigPerWorklogId = {};
    const report: ISyncReport = { log: [], users: [] };
    const workLog = await syncController.publishedFilterWorklogsAndAssignWtmConfig(inputWorklogs, wtmTsConfigPerWorklogs, report);
    expect(workLog).toHaveLength(4);
    expect(wtmTsConfigPerWorklogs).toBeTruthy();
    expect(wtmTsConfigPerWorklogs["10"].artifact).toBe("CET-WITHOUT-FIELD");
    expect(wtmTsConfigPerWorklogs["20"].artifact).toBe("CET-WITH-NITS-1");
    expect(wtmTsConfigPerWorklogs["30"].artifact).toBe("CET-WITH-NITS-2");
    expect(wtmTsConfigPerWorklogs["40"].artifact).toBe("CET-WITHOUT-FIELD");
    expect(wtmTsConfigPerWorklogs["50"]).toBeUndefined();
    expect(wtmTsConfigPerWorklogs["60"]).toBeUndefined();
    expect(report.log[3]).toContain("WARNING");
    expect(report.log[4]).toContain("skipped. Project OUT is not configured.");
    expect(report.log[5]).toContain("nor parent has no valid configuration");
});

test("separateTimesheets", async () => {
    const syncController = new TestingSyncController(null, null, null, null, null);
    const result = syncController.publishedSeparateTimesheets([
        {
            data: undefined,
        },
        {
            data: {
                unknown: 1,
            },
        },
        {
            data: {
                nits: null,
            },
        },
        {
            data: {
                nits: [],
            },
        },
    ] as any);
    expect(result.timesheetsToDelete).toHaveLength(2);
    expect(result.timesheetsToDelete[0].data.nits).toBeNull();
    expect(result.timesheetsToDelete[1].data.nits).toBeTruthy();
    expect(result.timesheetsToRemain).toHaveLength(2);
    expect(result.timesheetsToRemain[0].data).toBeUndefined();
    expect(result.timesheetsToRemain[1].data.nits).toBeUndefined();
});

test("computeNewTimesheets", async () => {
    const syncController = new TestingSyncController(null, null, null, null, null);
    const result = syncController.publishedComputeNewTimesheets(null, null);
    //TODO: BF: tady
    expect(result).toHaveLength(0);
});

class TestingSyncController extends SyncController {
    public async publishedFilterWorklogsAndAssignWtmConfig(
        worklogList: Worklog[],
        wtmTsConfigPerWorklogs: IWtmTsConfigPerWorklogId,
        report: ISyncReport
    ): Promise<Worklog[]> {
        return this.filterWorklogsAndAssignWtmConfig(worklogList, wtmTsConfigPerWorklogs, report);
    }

    public publishedSeparateTimesheets(exitingTimesheets: Timesheet[]): { timesheetsToDelete: Timesheet[]; timesheetsToRemain: Timesheet[] } {
        return this.separateTimesheets(exitingTimesheets);
    }

    public publishedComputeNewTimesheets(timesheetMapping: TimesheetMapping[], timesheetsToRemain: Timesheet[]): Timesheet[] {
        return this.computeNewTimesheets(timesheetMapping, timesheetsToRemain);
    }
}
