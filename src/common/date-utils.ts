// require because of Jest
const moment = require("moment");

class DateUtils {
    public toDate(date: number | Date | string = new Date()): Date {
        if (typeof date === "number") {
            return new Date(date * 1000);
        }
        if (typeof date === "string") {
            return new Date(date);
        }
        return date;
    }

    public toTimestamp(date: number | Date | string = new Date()): number {
        if (typeof date === "number") {
            return date;
        }
        if (typeof date === "string") {
            date = new Date(date);
        }
        return Math.round(date.getTime() / 1000);
    }

    public toIsoFormat(date: number | Date | string = new Date()): string {
        if (typeof date === "string") {
            date = new Date(date);
        }
        if (typeof date === "number") {
            date = this.toDate(date);
        }
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    }

    public formatDateTime(timestamp: number | Date): string {
        const d = (typeof timestamp === "object" ? timestamp : this.toDate(timestamp)) as Date;
        return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${d.getHours()}:${(d.getMinutes() + "").padStart(2, "0")}`;
    }

    public formatDate(date: number | Date | string): string {
        if (typeof date === "string") {
            date = new Date(date);
        }
        const d = (typeof date === "object" ? date : this.toDate(date)) as Date;
        const year = new Date().getFullYear() == d.getFullYear() ? "" : d.getFullYear();
        return `${d.getDate()}.${d.getMonth() + 1}.${year}`;
    }

    public increase(date: number | Date | string, unit: string, unitCount: number = 1): string {
        if (typeof date === "string") {
            date = new Date(date);
        }
        if (typeof date === "number") {
            date = this.toDate(date);
        }
        return moment(date).add(unitCount, unit).toDate().toISOString();
    }

    public increaseDay(date: Date, days: number = 1): string {
        return this.increase(date, "days", days);
    }

    public substract(date: Date, unit: string, unitCount: number = 1): string {
        return this.increase(date, unit, -unitCount);
    }

    public substractDay(date: Date, days: number = 1): string {
        return this.increase(date, "days", -days);
    }

    public daysBetween(firstDate: string | number | Date, secondDate: string | number | Date): number {
        const t1 = this.toTimestamp(firstDate);
        const t2 = this.toTimestamp(secondDate);
        return (t2 - t1) / 24 / 3600;
    }
}

export default new DateUtils();
