import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {SqlLogger} from "./core/logger/logger";
import {SQL_LOGGER_PROVIDER} from "./core/logger/logger.module";
import {CoreEnvironmentProvider} from "./core/environment/environment.service";
import {BadRequestException, Logger, ValidationPipe} from "@nestjs/common";
import {handleProcessSignal, PROCESS_SIGNAL} from "./core/http-server/http-server";

async function bootstrap() {
    const {PORT} = CoreEnvironmentProvider.useValue.ENVIRONMENT;
    const app = await NestFactory.create(AppModule, {
        bodyParser: true,
        logger: new SqlLogger("[USER__SERVICE]"),
    });
    app.useLogger(new SqlLogger("USER__SERVICE", app.get(SQL_LOGGER_PROVIDER)));

    app.setGlobalPrefix(CoreEnvironmentProvider.useValue.ENVIRONMENT.APP_BASE_URL, {
        exclude: [],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                exposeDefaultValues: true,
            },
            whitelist: true,
            forbidUnknownValues: true,
            forbidNonWhitelisted: true,
            skipMissingProperties: false,
            stopAtFirstError: true,
            exceptionFactory: (error) => {
                Logger.error("Validate error");
                Logger.error(error);
                return new BadRequestException(error);
            },
        }),
    );

    handleProcessSignal(app)
    Logger.log(`Trying to start app on port : ${PORT}`);
    await app.init();
    await app.listen(PORT, "0.0.0.0", () => {
        Logger.log(`App started on port : ${PORT}`);
        if (process.send) {
            process.send(PROCESS_SIGNAL.READY);
        }
    });
}

bootstrap();
