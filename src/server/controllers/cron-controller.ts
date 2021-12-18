import { Inject } from "injector";
import dateUtils from "../../common/date-utils";
import { ProjectController } from "./project-controller";
import { SyncController } from "./sync-controller";

@Inject.Singleton
export class CronController {
    private lastExcetionTime: Date;

    constructor(private projectController: ProjectController, private syncController: SyncController) {}

    public run() {
        console.log("Cron running");
        setInterval(this.execute.bind(this), 60000);
    }

    private async execute() {
        const prevHour = this.lastExcetionTime ? this.lastExcetionTime.getHours() : -1;
        const thisHour = new Date().getHours();
        this.lastExcetionTime = new Date();
        if (prevHour == thisHour) {
            return;
        }
        console.log(`Cron execution ${dateUtils.formatDateTime(new Date())}`);
        const systemConfig = await this.projectController.getSystemConfig();
        if (systemConfig.syncHour == thisHour) {
            console.log(`Time for sync`);
            await this.syncController.sync();
        }
    }
}
