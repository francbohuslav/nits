import { Inject } from "injector";
import dateUtils from "../../common/date-utils";
import { NotifyController } from "./notify-controller";
import { ProjectController } from "./project-controller";
import { SyncController } from "./sync-controller";

@Inject.Singleton
export class CronController {
    private lastExcetionTime: Date = new Date();

    constructor(private projectController: ProjectController, private syncController: SyncController, private notifyController: NotifyController) {}

    public run() {
        console.log("Cron running");
        setInterval(this.execute.bind(this), 60000);
    }

    private async execute() {
        const prevHour = this.lastExcetionTime.getHours();
        const thisHour = new Date().getHours();
        this.lastExcetionTime = new Date();
        if (prevHour == thisHour) {
            return;
        }

        console.log(`Cron execution ${dateUtils.formatDateTime(new Date())}`);
        const systemConfig = await this.projectController.getSystemConfig();
        if (systemConfig.syncHour == thisHour) {
            console.log(`Time for sync`);
            console.log(await this.syncController.sync());
        }

        const nextMonth = dateUtils.increase(dateUtils.getStartOfMonth(), "months", 1);
        const lastDayOfThisMonth = dateUtils.toIsoFormat(dateUtils.substractDay(nextMonth));
        if (systemConfig.notifyHour == thisHour && dateUtils.toIsoFormat(new Date()) == lastDayOfThisMonth) {
            console.log(`Time for notifications`);
            console.log(await this.notifyController.monthNotification());
        }
    }
}
