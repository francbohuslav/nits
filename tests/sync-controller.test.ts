import { IArtifactSettings } from "../src/common/interfaces";
import { IInterval, IWtmTsConfigPerIssueKey, SyncController } from "../src/server/controllers/sync-controller";
import { ISyncReport, TimesheetMapping, TimesheetMappingsPerDay } from "../src/server/models/interfaces";
import { IIssue, Worklog } from "../src/server/models/jira/interfaces";
import { Timesheet } from "../src/server/models/uu/interfaces";

test("filterWorklogsAndAssignWtmConfig", async () => {
    const NITS_FIELD_VALUE_1 = "1";
    const NITS_FIELD_VALUE_2 = "2";
    const NITS_FIELD_UNKNOWN_VALUE = "3";
    const projectController = {
        async getArtifactSettings(): Promise<IArtifactSettings[]> {
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

    const issuesById: { [id: string]: IIssue } = {
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

    const syncController = new TestingSyncController(
        null,
        null,
        null,
        projectController,
        {
            cryptoSalt: "test",
            serverAddress: "",
            email: {
                password: "",
                sender: "",
                user: "",
            },
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
    const inputWorklogs: Partial<Worklog>[] = [
        {
            id: "10",
            issueId: "1",
        },
        {
            id: "20",
            issueId: "2",
        },
        {
            id: "30",
            issueId: "3",
        },
        {
            id: "40",
            issueId: "4",
        },
        {
            id: "50",
            issueId: "5",
        },
        {
            id: "60",
            issueId: "6",
        },
    ];
    const wtmTsConfigPerIssueId: IWtmTsConfigPerIssueKey = {};
    const report: ISyncReport = { log: [], users: [] };
    const workLog = await syncController.publishedFilterWorklogsAndAssignWtmConfig(inputWorklogs as Worklog[], issuesById, wtmTsConfigPerIssueId, report);
    expect(workLog).toHaveLength(4);
    expect(wtmTsConfigPerIssueId).toBeTruthy();
    expect(wtmTsConfigPerIssueId["CET-1"].wtmArtifact).toBe("CET-WITHOUT-FIELD");
    expect(wtmTsConfigPerIssueId["CET-2"].wtmArtifact).toBe("CET-WITH-NITS-1");
    expect(wtmTsConfigPerIssueId["CET-3"].wtmArtifact).toBe("CET-WITH-NITS-2");
    expect(wtmTsConfigPerIssueId["CET-4"].wtmArtifact).toBe("CET-WITHOUT-FIELD");
    expect(wtmTsConfigPerIssueId["5"]).toBeUndefined();
    expect(wtmTsConfigPerIssueId["6"]).toBeUndefined();
    expect(report.log[3]).toContain("WARNING");
    expect(report.log[4]).toContain("skipped. Project OUT is not configured.");
    expect(report.log[5]).toContain("nor parent has no valid configuration");
});

test("separateTimesheets", async () => {
    const syncController = new TestingSyncController(null, null, null, null, null, null);
    const result = syncController.separateTimesheets2([
        {
            data: undefined,
        } as Partial<Timesheet>,
        {
            data: {
                unknown: 1,
            },
        } as any,
        {
            data: {
                nits: null,
            },
        } as Partial<Timesheet>,
        {
            data: {
                nits: {},
            },
        } as Partial<Timesheet>,
    ] as any);
    expect(result.timesheetsToDelete).toHaveLength(2);
    expect(result.timesheetsToDelete[0].data.nits).toBeNull();
    expect(result.timesheetsToDelete[1].data.nits).toBeTruthy();
    expect(result.timesheetsToRemain).toHaveLength(2);
    expect(result.timesheetsToRemain[0].data).toBeUndefined();
    expect(result.timesheetsToRemain[1].data.nits).toBeUndefined();
});

describe("computeNewTimesheets", () => {
    test("split_to_days", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const result = syncController.computeNewTimesheets2(
            {
                "2021-10-11": [
                    {
                        date: "2021-10-11",
                        description: "description 1",
                        spentSeconds: 3600,
                        jiraIssueKey: "CET-1",
                        wtmArtifact: "UNI-BT:USYT.NI_20/NITS",
                        jiraWorklogs: [{ id: "1" }, { id: "2" }] as any,
                    },
                    {
                        date: "2021-10-11",
                        description: "description 2",
                        spentSeconds: 1800,
                        jiraIssueKey: "CET-2",
                        wtmArtifact: "UNI-BT:USYT.NI_20/NITS2",
                        jiraWorklogs: [{ id: "3" }] as any,
                    },
                ],
                "2021-10-12": [
                    {
                        date: "2021-10-12",
                        description: "description 1",
                        spentSeconds: 3600,
                        jiraIssueKey: "CET-1",
                        wtmArtifact: "UNI-BT:USYT.NI_20/NITS",
                        jiraWorklogs: [{ id: "1" }, { id: "2" }] as any,
                    },
                    {
                        date: "2021-10-12",
                        description: "description 2",
                        spentSeconds: 1800,
                        jiraIssueKey: "CET-2",
                        wtmArtifact: "UNI-BT:USYT.NI_20/NITS2",
                        jiraWorklogs: [{ id: "3" }] as any,
                    },
                ],
            },
            [createTimesheet("2021-10-11T05:00:00Z", "2021-10-11T07:30:00Z"), createTimesheet("2021-10-12T07:00:00Z", "2021-10-12T07:30:00Z")]
        );
        expect(result).toHaveLength(4);
        expect(result[0]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-11T07:30:00.000Z",
                datetimeTo: "2021-10-11T08:30:00.000Z",
                subject: "UNI-BT:USYT.NI_20/NITS",
            })
        );
        expect(result[1]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-11T08:30:00.000Z",
                datetimeTo: "2021-10-11T09:00:00.000Z",
                subject: "UNI-BT:USYT.NI_20/NITS2",
            })
        );
        expect(result[2]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T06:00:00.000Z",
                datetimeTo: "2021-10-12T07:00:00.000Z",
                subject: "UNI-BT:USYT.NI_20/NITS",
            })
        );
        expect(result[3]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T07:30:00.000Z",
                datetimeTo: "2021-10-12T08:00:00.000Z",
                subject: "UNI-BT:USYT.NI_20/NITS2",
            })
        );
    });
});

describe("getNextFreeTimeSegment", () => {
    let syncController: TestingSyncController;
    let searchFromTime: Date;

    beforeEach(() => {
        syncController = new TestingSyncController(null, null, null, null, null, null);
        searchFromTime = new Date("2021-10-12T06:00:00Z");
    });

    test("basic", () => {
        expect(syncController.getNextFreeTimeSegment2(searchFromTime, [], false, 0).interval).toEqual({
            from: searchFromTime,
            to: new Date("2021-10-12T22:00:00Z"),
        });
    });
    test("Remaining timesheets are before", () => {
        expect(
            syncController.getNextFreeTimeSegment2(searchFromTime, [createTimesheet("2021-10-12T04:00:00Z", "2021-10-12T05:00:00Z")], false, 0).interval
        ).toEqual({
            from: searchFromTime,
            to: new Date("2021-10-12T22:00:00Z"),
        });
    });
    test("Remaining timesheets are before and end time is same as searchFromTime", () => {
        expect(
            syncController.getNextFreeTimeSegment2(searchFromTime, [createTimesheet("2021-10-12T04:00:00Z", "2021-10-12T06:00:00Z")], false, 0).interval
        ).toEqual({
            from: searchFromTime,
            to: new Date("2021-10-12T22:00:00Z"),
        });
    });
    test("Remaining timesheets are on same time as searchFromTime", () => {
        expect(
            syncController.getNextFreeTimeSegment2(searchFromTime, [createTimesheet("2021-10-12T06:00:00Z", "2021-10-12T08:00:00Z")], false, 0).interval
        ).toEqual({
            from: new Date("2021-10-12T08:00:00Z"),
            to: new Date("2021-10-12T22:00:00Z"),
        });
    });
    test("Remaining timesheets are later than searchFromTime", () => {
        expect(
            syncController.getNextFreeTimeSegment2(searchFromTime, [createTimesheet("2021-10-12T10:00:00Z", "2021-10-12T12:00:00Z")], false, 0).interval
        ).toEqual({
            from: new Date("2021-10-12T06:00:00Z"),
            to: new Date("2021-10-12T10:00:00Z"),
        });
    });
    test("Next timesheets overlap searchFromTime", () => {
        expect(
            syncController.getNextFreeTimeSegment2(
                searchFromTime,
                [createTimesheet("2021-10-12T05:00:00Z", "2021-10-12T07:00:00Z"), createTimesheet("2021-10-12T10:00:00Z", "2021-10-12T12:00:00Z")],
                false,
                0
            ).interval
        ).toEqual({
            from: new Date("2021-10-12T07:00:00Z"),
            to: new Date("2021-10-12T10:00:00Z"),
        });
    });
    test("Next timesheets overlap searchFromTime", () => {
        expect(syncController.getNextFreeTimeSegment2(searchFromTime, [createTimesheet("2021-10-12T05:00:00Z", "2021-10-12T22:00:00Z")], false, 0)).toBeNull();
    });
    test("Adjacent Remaining timesheets", () => {
        expect(
            syncController.getNextFreeTimeSegment2(
                searchFromTime,
                [createTimesheet("2021-10-12T06:00:00Z", "2021-10-12T07:00:00Z"), createTimesheet("2021-10-12T07:00:00Z", "2021-10-12T08:00:00Z")],
                false,
                0
            ).interval
        ).toEqual({
            from: new Date("2021-10-12T08:00:00Z"),
            to: new Date("2021-10-12T22:00:00Z"),
        });
    });
    test("Launch pause", () => {
        expect(
            syncController.getNextFreeTimeSegment2(
                searchFromTime,
                [createTimesheet("2021-10-12T06:00:00Z", "2021-10-12T07:00:00Z"), createTimesheet("2021-10-12T08:00:00Z", "2021-10-12T09:00:00Z")],
                false,
                4
            )
        ).toEqual({
            interval: {
                from: new Date("2021-10-12T07:30:00Z"),
                to: new Date("2021-10-12T08:00:00Z"),
            },
            isPauseApplied: true,
        });
    });
    test("Pause with exactly fit", () => {
        expect(
            syncController.getNextFreeTimeSegment2(
                searchFromTime,
                [createTimesheet("2021-10-12T06:00:00Z", "2021-10-12T07:00:00Z"), createTimesheet("2021-10-12T07:30:00Z", "2021-10-12T09:00:00Z")],
                false,
                4
            )
        ).toEqual({
            interval: {
                from: new Date("2021-10-12T09:00:00Z"),
                to: new Date("2021-10-12T22:00:00Z"),
            },
            isPauseApplied: true,
        });
    });
    test("No space because of pause", () => {
        expect(syncController.getNextFreeTimeSegment2(searchFromTime, [createTimesheet("2021-10-12T06:00:00Z", "2021-10-12T21:30:00Z")], false, 4)).toBeNull();
    });
});

describe("computeNewTimesheetsInDay", () => {
    test("empty", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        expect(syncController.computeNewTimesheetsInDay2([], []).length).toBe(0);
    });

    test("no_remaining_timesheets", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const tsmBase = {
            date: "2021-10-12",
            description: "desc",
            jiraIssueKey: "C-1",
            jiraWorklogs: [{ id: "1" }] as any,
        };
        const newTimesheets = syncController.computeNewTimesheetsInDay2(
            [
                {
                    ...tsmBase,
                    spentSeconds: 3600,
                    wtmArtifact: "UNI-BT:1",
                },
                {
                    ...tsmBase,
                    spentSeconds: 1800,
                    wtmArtifact: "UNI-BT:2",
                },
                {
                    ...tsmBase,
                    spentSeconds: 900,
                    wtmArtifact: "UNI-BT:3",
                },
            ],
            []
        );
        expect(newTimesheets).toHaveLength(3);
        expect(newTimesheets[0]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T06:00:00.000Z",
                datetimeTo: "2021-10-12T07:00:00.000Z",
                subject: "UNI-BT:1",
            } as Timesheet)
        );
        expect(newTimesheets[1]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T07:00:00.000Z",
                datetimeTo: "2021-10-12T07:30:00.000Z",
                subject: "UNI-BT:2",
            } as Timesheet)
        );
        expect(newTimesheets[2]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T07:30:00.000Z",
                datetimeTo: "2021-10-12T07:45:00.000Z",
                subject: "UNI-BT:3",
            } as Timesheet)
        );
    });

    test("time_shift_because_of_too_much", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const tsmBase = {
            date: "2021-10-12",
            description: "desc",
            jiraIssueKey: "C-1",
            jiraWorklogs: [{ id: "1" }] as any,
        };
        const newTimesheets = syncController.computeNewTimesheetsInDay2(
            [
                {
                    ...tsmBase,
                    spentSeconds: 3600,
                    wtmArtifact: "UNI-BT:1",
                },
                {
                    ...tsmBase,
                    spentSeconds: 17 * 3600,
                    wtmArtifact: "UNI-BT:2",
                },
            ],
            []
        );
        expect(newTimesheets).toHaveLength(2);
        expect(newTimesheets[0]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T04:00:00.000Z",
                datetimeTo: "2021-10-12T05:00:00.000Z",
                subject: "UNI-BT:1",
            } as Timesheet)
        );
        expect(newTimesheets[1]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T05:00:00.000Z",
                datetimeTo: "2021-10-12T22:00:00.000Z",
                subject: "UNI-BT:2",
            } as Timesheet)
        );
    });

    test("no_space_for_timesheets", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const tsmBase = {
            date: "2021-10-12",
            description: "desc",
            jiraIssueKey: "C-1",
            jiraWorklogs: [{ id: "1" }] as any,
        };
        expect(() =>
            syncController.computeNewTimesheetsInDay2(
                [
                    {
                        ...tsmBase,
                        spentSeconds: 23 * 3600,
                        wtmArtifact: "UNI-BT:1",
                    },
                ],
                [createTimesheet("2021-10-12T05:00:00Z", "2021-10-12T07:00:00Z")]
            )
        ).toThrow(/There is no space in .* for new timesheets/);
    });

    test("full_test_with_splitted", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const tsmBase = {
            date: "2021-10-12",
            description: "desc",
            jiraIssueKey: "C-1",
            jiraWorklogs: [{ id: "1" }] as any,
        };
        const newTimesheets = syncController.computeNewTimesheetsInDay2(
            [
                {
                    ...tsmBase,
                    spentSeconds: 4 * 3600,
                    wtmArtifact: "UNI-BT:1",
                },
                {
                    ...tsmBase,
                    spentSeconds: 4 * 3600,
                    wtmArtifact: "UNI-BT:2",
                },
            ],
            [createTimesheet("2021-10-12T05:45:00Z", "2021-10-12T06:45:00Z"), createTimesheet("2021-10-12T12:00:00Z", "2021-10-12T22:00:00Z")]
        );

        expect(newTimesheets).toHaveLength(3);
        expect(newTimesheets[0]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T02:30:00.000Z",
                datetimeTo: "2021-10-12T05:45:00.000Z",
                subject: "UNI-BT:1",
            } as Timesheet)
        );
        expect(newTimesheets[1]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T07:15:00.000Z",
                datetimeTo: "2021-10-12T08:00:00.000Z",
                subject: "UNI-BT:1",
            } as Timesheet)
        );
        expect(newTimesheets[2]).toEqual(
            expect.objectContaining({
                datetimeFrom: "2021-10-12T08:00:00.000Z",
                datetimeTo: "2021-10-12T12:00:00.000Z",
                subject: "UNI-BT:2",
            } as Timesheet)
        );
    });
});

describe("computeNewTimesheetInSegment", () => {
    test("empty", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const newTimesheets: Timesheet[] = [];
        syncController.computeNewTimesheetInSegment2({ from: new Date("2021-10-12T06:00:00Z"), to: new Date("2021-10-12T06:00:00Z") }, newTimesheets, []);
        expect(newTimesheets.length).toBe(0);
    });

    test("timesheet_shorter_then_segment", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const newTimesheets: Timesheet[] = [];
        const timesheetMappings: TimesheetMapping[] = [
            {
                date: "2021-10-12",
                description: "desc",
                jiraIssueKey: "C-1",
                jiraWorklogs: [{ id: "1" }] as any,
                spentSeconds: 3600,
                wtmArtifact: "UNI-BT:1",
            },
        ];
        syncController.computeNewTimesheetInSegment2(
            { from: new Date("2021-10-12T06:00:00Z"), to: new Date("2021-10-12T08:00:00Z") },
            newTimesheets,
            timesheetMappings
        );
        expect(newTimesheets.length).toBe(1);
        expect(newTimesheets[0]).toEqual({
            datetimeFrom: "2021-10-12T06:00:00.000Z",
            datetimeTo: "2021-10-12T07:00:00.000Z",
            description: "desc",
            subject: "UNI-BT:1",
            data: {
                nits: {
                    issueKey: "C-1",
                    worklogIds: ["1"],
                },
            },
        } as Timesheet);
        expect(timesheetMappings).toHaveLength(0);
    });

    test("timesheet_longer_then_segment", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const newTimesheets: Timesheet[] = [];
        const timesheetMappings: TimesheetMapping[] = [
            {
                date: "2021-10-12",
                description: "desc",
                jiraIssueKey: "C-1",
                jiraWorklogs: [{ id: "1" }] as any,
                spentSeconds: 3600,
                wtmArtifact: "UNI-BT:1",
            },
        ];
        syncController.computeNewTimesheetInSegment2(
            { from: new Date("2021-10-12T06:00:00Z"), to: new Date("2021-10-12T06:45:00Z") },
            newTimesheets,
            timesheetMappings
        );
        expect(newTimesheets.length).toBe(1);
        expect(newTimesheets[0].datetimeFrom).toEqual("2021-10-12T06:00:00.000Z");
        expect(newTimesheets[0].datetimeTo).toEqual("2021-10-12T06:45:00.000Z");
        expect(timesheetMappings).toHaveLength(1);
        expect(timesheetMappings[0].spentSeconds).toBe(15 * 60);
    });

    test("timesheets_exact_as_segment", () => {
        const syncController = new TestingSyncController(null, null, null, null, null, null);
        const newTimesheets: Timesheet[] = [];
        const timesheetMappings: TimesheetMapping[] = [
            {
                date: "2021-10-12",
                description: "desc",
                jiraIssueKey: "C-1",
                jiraWorklogs: [{ id: "1" }] as any,
                spentSeconds: 3600,
                wtmArtifact: "UNI-BT:1",
            },
            // this will not be used
            {
                date: "2021-10-12",
                description: "desc2",
                jiraIssueKey: "C-2",
                jiraWorklogs: [{ id: "2" }] as any,
                spentSeconds: 1800,
                wtmArtifact: "UNI-BT:2",
            },
        ];
        syncController.computeNewTimesheetInSegment2(
            { from: new Date("2021-10-12T06:00:00Z"), to: new Date("2021-10-12T07:00:00Z") },
            newTimesheets,
            timesheetMappings
        );
        expect(newTimesheets.length).toBe(1);
        expect(newTimesheets[0]).toEqual({
            datetimeFrom: "2021-10-12T06:00:00.000Z",
            datetimeTo: "2021-10-12T07:00:00.000Z",
            description: "desc",
            subject: "UNI-BT:1",
            data: {
                nits: {
                    issueKey: "C-1",
                    worklogIds: ["1"],
                },
            },
        } as Timesheet);
        expect(timesheetMappings).toHaveLength(1);
    });
});

class TestingSyncController extends SyncController {
    public async publishedFilterWorklogsAndAssignWtmConfig(
        worklogList: Worklog[],
        issuesById: { [id: string]: IIssue },
        wtmTsConfigPerIssueKey: IWtmTsConfigPerIssueKey,
        report: ISyncReport
    ): Promise<Worklog[]> {
        return this.filterWorklogsAndAssignWtmConfig(worklogList, issuesById, wtmTsConfigPerIssueKey, report);
    }

    public separateTimesheets2(exitingTimesheets: Timesheet[]): { timesheetsToDelete: Timesheet[]; timesheetsToRemain: Timesheet[] } {
        return this.separateTimesheets(exitingTimesheets);
    }

    public computeNewTimesheets2(timesheetMappingsPerDay: TimesheetMappingsPerDay, timesheetsToRemain: Timesheet[]): Timesheet[] {
        return this.computeNewTimesheets(timesheetMappingsPerDay, timesheetsToRemain);
    }

    public getNextFreeTimeSegment2(
        searchFromTime: Date,
        timesheetsToRemain: Timesheet[],
        isPauseApplied: boolean,
        alreadyProcessedHours: number
    ): { interval: IInterval; isPauseApplied: boolean } {
        return this.getNextFreeTimeSegment(searchFromTime, timesheetsToRemain, isPauseApplied, alreadyProcessedHours);
    }

    public computeNewTimesheetInSegment2(interval: IInterval, newTimesheets: Timesheet[], timesheetMapping: TimesheetMapping[]) {
        return this.computeNewTimesheetInSegment(interval, newTimesheets, timesheetMapping);
    }

    public computeNewTimesheetsInDay2(timesheetMapping: TimesheetMapping[], timesheetsToRemain: Timesheet[]): Timesheet[] {
        return this.computeNewTimesheetsInDay(timesheetMapping, timesheetsToRemain);
    }
}

function createTimesheet(d1: string, d2: string): Timesheet {
    const t = new Timesheet();
    t.datetimeFrom = d1;
    t.datetimeTo = d2;
    return t;
}
