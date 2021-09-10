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

    public increase(unit: string, unitCount: number = 1): string {
        return moment(new Date()).add(unitCount, unit).toDate().toISOString();
    }

    public increaseDay(days: number = 1): string {
        return this.increase("days", days);
    }

    public substract(unit: string, unitCount: number = 1): string {
        return this.increase(unit, -unitCount);
    }

    public substractDay(days: number = 1): string {
        return this.increase("days", -days);
    }
}

export default new DateUtils();
