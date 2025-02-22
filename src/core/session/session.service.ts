import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { throws } from "../utils/throw";
import { ISessionStorage } from "./session-storage.service";
import { SESSION_TYPE } from "./session-definition";

export abstract class BaseSessionService<NS, V = string> {
	protected logger!: ContextLogger;

	public abstract readonly NAMESPACE: NS;

	protected constructor(
		public storage: ISessionStorage,
		protected loggerService: LoggerService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async addSession(type: SESSION_TYPE, id: string, expireInSeconds: number, value: V): Promise<V | never> {
		const cacheKey = this.cacheKey(type, id);
		const res = await this.storage.setEX(
			cacheKey,
			expireInSeconds,
			this.valueSerializer({
				...value,
				exp: Math.floor(Date.now() / 1000) + expireInSeconds,
				iat: Math.floor(Date.now() / 1000),
			}),
		);
		if (res) {
			this.logger.log({}, `Session added for ${cacheKey}`);
			return value;
		} else {
			this.logger.log({}, `Failed to add session for ${cacheKey}`);
			throw new BadRequestException(SYSTEM_CODE.SESSION_NOT_AVAILABLE);
		}
	}

	public async getSessionValue(type: SESSION_TYPE, id: string): Promise<V> {
		try {
			const cacheKey = this.cacheKey(type, id);
			return this.valueDeserializer(
				(await this.storage.get(cacheKey)) || throws(new Error("Session key not exist")),
			);
		} catch (err) {
			this.logger.error({}, "Failed to get session value", err as Error);
			throw new UnauthorizedException("Failed to get session value");
		}
	}

	public async checkSession(type: SESSION_TYPE, id: string): Promise<true | never> {
		const cacheKey = this.cacheKey(type, id);
		try {
			await this.storage.get(cacheKey);
			this.logger.log({}, `Session check success for ${cacheKey}`);
			return true;
		} catch (e) {
			this.logger.log({}, `Session check failed for ${cacheKey}`);
			throw new UnauthorizedException(SYSTEM_CODE.SESSION_NOT_AVAILABLE);
		}
	}
	public async getKeys(type: SESSION_TYPE, id: string): Promise<Array<string>> {
		return (await this.storage.getKeys(this.cacheKey(type, id))).map((k) => k.replace(this.cacheKey(type, ""), ""));
	}

	public async clearSession(type: SESSION_TYPE, id: string): Promise<boolean | never> {
		const cacheKey = this.cacheKey(type, id);
		await this.storage.del(cacheKey);
		return true;
	}

	protected cacheKey(type: SESSION_TYPE, id: string): string {
		return `${this.NAMESPACE}:${type}:${id}`;
	}

	protected abstract valueDeserializer(data: string): V;

	protected abstract valueSerializer(data: V): string;
}
