// require because of Jest
const moment = require("moment");

class DateUtils {
    public timestampToDate(timestamp: number): Date {
        return new Date(timestamp * 1000);
    }

    public getActualTimestamp(): number {
        return Math.round(new Date().getTime() / 1000);
    }

    public formatDateTime(timestamp: number | Date) {
        const d = (typeof timestamp === "object" ? timestamp : this.timestampToDate(timestamp)) as Date;
        return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${d.getHours()}:${(d.getMinutes() + "").padStart(2, "0")}`;
    }

    public formatDate(date: number | Date | string) {
        if (typeof date === "string") {
            date = new Date(date);
        }
        const d = (typeof date === "object" ? date : this.timestampToDate(date)) as Date;
        const year = new Date().getFullYear() == d.getFullYear() ? "" : d.getFullYear();
        return `${d.getDate()}.${d.getMonth() + 1}.${year}`;
    }

    public increase(date: Date, unit: string, unitCount: number = 1): string {
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
}

export default new DateUtils();
