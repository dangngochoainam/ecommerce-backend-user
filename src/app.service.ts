import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "./core/logger/logger.service";

@Injectable()
export class AppService {
	protected logger!: ContextLogger;

	public constructor(
		protected loggerService: LoggerService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async getHello(): Promise<string> {
		return "Hello World!";
	}
}
