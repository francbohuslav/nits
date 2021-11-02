// require because of Jest
import moment, { unitOfTime } from "moment";
import { assert } from "./core";

class DateUtils {
    public toDate(date: IDateType = new Date()): Date {
        if (typeof date === "number") {
            return new Date(date * 1000);
        }
        if (typeof date === "string") {
            // Date in string in local timezone
            const match = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (match) {
                return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
            }
            return new Date(date);
        }
        return date;
    }

    public toTimestamp(date: IDateType = new Date()): number {
        if (typeof date === "number") {
            return date;
        }
        if (typeof date === "string") {
            date = new Date(date);
        }
        return Math.round(date.getTime() / 1000);
    }

    /**
     * Returns date in ISO format in local zone, e.g 2021-10-08
     * @param date input date
     * @returns Date only in ISO format, e.g 2021-10-08
     */
    public toIsoFormat(date: IDateType = new Date()): string {
        if (typeof date === "string") {
            date = new Date(date);
        }
        if (typeof date === "number") {
            date = this.toDate(date);
        }
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    }

    public formatDateTime(date: IDateType = new Date(), withLeadingSpaces: boolean = false): string {
        const d = this.toDate(date);
        const zeros = withLeadingSpaces ? 2 : 1;
        return `${(d.getDate() + "").padStart(zeros, " ")}.${(d.getMonth() + 1 + "").padStart(zeros, " ")}.${d.getFullYear()} ${(d.getHours() + "").padStart(
            zeros,
            " "
        )}:${(d.getMinutes() + "").padStart(2, "0")}`;
    }

    public formatDate(date: IDateType): string {
        if (typeof date === "string") {
            date = new Date(date);
        }
        const d = (typeof date === "object" ? date : this.toDate(date)) as Date;
        const year = new Date().getFullYear() == d.getFullYear() ? "" : d.getFullYear();
        return `${d.getDate()}.${d.getMonth() + 1}.${year}`;
    }

    public formatHours(hours: number): string {
        const hourPart = Math.floor(hours);
        const minutePart = (hours - hourPart) * 60;
        return `${hourPart}:${minutePart.toFixed(0).padStart(2, "0")}`;
    }

    public increase(date: IDateType, units: unitOfTime.DurationConstructor, unitCount: number = 1): Date {
        if (typeof date === "string") {
            date = new Date(date);
        }
        if (typeof date === "number") {
            date = this.toDate(date);
        }
        return moment(date).add(unitCount, units).toDate();
    }

    public increaseDay(date: IDateType, days: number = 1): Date {
        return this.increase(date, "days", days);
    }

    public substract(date: IDateType, units: unitOfTime.DurationConstructor, unitCount: number = 1): Date {
        return this.increase(date, units, -unitCount);
    }

    public substractDay(date: IDateType, days: number = 1): Date {
        return this.increase(date, "days", -days);
    }

    public secondsBetween(firstDate: IDateType, secondDate: IDateType): number {
        const t1 = this.toTimestamp(firstDate);
        const t2 = this.toTimestamp(secondDate);
        return t2 - t1;
    }

    public daysBetween(firstDate: IDateType, secondDate: IDateType): number {
        return this.secondsBetween(firstDate, secondDate) / 24 / 3600;
    }

    public areEquals(date1: IDateType, date2: IDateType): boolean {
        assert(date1);
        assert(date2);
        return this.toTimestamp(date1) == this.toTimestamp(date2);
    }

    public isLowerThen(lowerDate: IDateType, higherDate: IDateType): boolean {
        assert(lowerDate);
        assert(higherDate);
        return this.toTimestamp(lowerDate) < this.toTimestamp(higherDate);
    }

    public isLowerOrEqualsThen(lowerDate: IDateType, higherDate: IDateType): boolean {
        assert(lowerDate);
        assert(higherDate);
        return this.toTimestamp(lowerDate) <= this.toTimestamp(higherDate);
    }

    public getStartOfDay(date: IDateType = new Date()): Date {
        return this.toDate(this.toIsoFormat(date));
    }

    public getStartOfMonth(date: IDateType = new Date()): Date {
        return this.toDate(this.toIsoFormat(date).replace(/-\d+$/, "-01"));
    }
}

const dateUtils = new DateUtils();

type IDateType = string | number | Date;

export default dateUtils;
