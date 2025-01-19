import {INestApplication, Logger} from "@nestjs/common";

export enum PROCESS_SIGNAL {
    READY = "ready",
    UNCAUGHT = "uncaughtException",
    INTERRUPT = "SIGINT",
    TERMINATE = "SIGTERM",
    QUIT = "SIGQUIT",
}

export const stopProcess =
    async (app: INestApplication<any>, signal: PROCESS_SIGNAL): Promise<void> => {
        Logger.log(`Gracefully shutting down due to ${signal}...`);
        await app.close();
        Logger.log(`Successfully close app`);
        if (process.disconnect) {
            Logger.log(`Successfully disconnect`);
            process.disconnect();
        }
        if (process.exit) {
            Logger.log(`Successfully exit`);
            process.exit();
        }
        Logger.log(`Successfully shutting down`);
    }

export const handleProcessSignal = (app: INestApplication<any>): void => {
    process.on(PROCESS_SIGNAL.QUIT, () => stopProcess(app, PROCESS_SIGNAL.QUIT));
    process.on(PROCESS_SIGNAL.TERMINATE, () => stopProcess(app, PROCESS_SIGNAL.TERMINATE));
    process.on(PROCESS_SIGNAL.INTERRUPT, () => stopProcess(app, PROCESS_SIGNAL.INTERRUPT));
    process.on(PROCESS_SIGNAL.UNCAUGHT, (err) => {
        Logger.error(`[FATAL!!] An unhandled exception occurred: Stack:: ${err?.stack}`, err);
    });
}
