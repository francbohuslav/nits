import dateUtils from "../src/common/date-utils";

test("toIsoFormat", () => {
    expect(dateUtils.toIsoFormat("2021-10-12")).toBe("2021-10-12");
    expect(dateUtils.toIsoFormat("2021-10-12T06:00:00Z")).toBe("2021-10-12");
    expect(dateUtils.toIsoFormat("2021-10-12T21:00:00Z")).toBe("2021-10-12");
    expect(dateUtils.toIsoFormat("2021-10-12T22:00:00Z")).toBe("2021-10-13");
    expect(dateUtils.toIsoFormat("2021-10-12T23:00:00Z")).toBe("2021-10-13");
    expect(dateUtils.toIsoFormat("2021-10-13T00:00:00Z")).toBe("2021-10-13");

    expect(dateUtils.toIsoFormat(new Date("2021-10-12T06:00:00Z"))).toBe("2021-10-12");
    expect(dateUtils.toIsoFormat(new Date("2021-10-12T21:00:00Z"))).toBe("2021-10-12");
    expect(dateUtils.toIsoFormat(new Date("2021-10-12T22:00:00Z"))).toBe("2021-10-13");
    expect(dateUtils.toIsoFormat(new Date("2021-10-12T23:00:00Z"))).toBe("2021-10-13");
    expect(dateUtils.toIsoFormat(new Date("2021-10-13T00:00:00Z"))).toBe("2021-10-13");
});

test("toDate", () => {
    expect(dateUtils.toDate("2021-10-13")).toEqual(new Date("2021-10-12T22:00:00Z"));
});

test("getStartOfDay", () => {
    expect(dateUtils.getStartOfDay("2021-10-13")).toEqual(new Date("2021-10-12T22:00:00Z"));
    expect(dateUtils.getStartOfDay("2021-10-12T21:00:00Z")).toEqual(new Date("2021-10-11T22:00:00Z"));
    expect(dateUtils.getStartOfDay("2021-10-12T22:00:00Z")).toEqual(new Date("2021-10-12T22:00:00Z"));
    expect(dateUtils.getStartOfDay("2021-10-13T06:00:00Z")).toEqual(new Date("2021-10-12T22:00:00Z"));
    expect(dateUtils.getStartOfDay(new Date("2021-10-12T21:00:00Z"))).toEqual(new Date("2021-10-11T22:00:00Z"));
    expect(dateUtils.getStartOfDay(new Date("2021-10-12T22:00:00Z"))).toEqual(new Date("2021-10-12T22:00:00Z"));
    expect(dateUtils.getStartOfDay(new Date("2021-10-13T06:00:00Z"))).toEqual(new Date("2021-10-12T22:00:00Z"));
});
