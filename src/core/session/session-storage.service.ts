import { Injectable } from "@nestjs/common";
import { AbstractRedisService } from "../redis/base-redis.service";

export interface ISessionStorage {
	set(key: string, value: string): Promise<boolean>;
	setEX(key: string, expireInSeconds: number, value: string): Promise<boolean>;
	get(key: string): Promise<string | null>;
	del(key: string): Promise<number>;
	flush(): Promise<boolean>;
	getKeys(pattern: string): Promise<Array<string>>;
}

@Injectable()
export class SessionRedisStorage extends AbstractRedisService<"SESSION"> implements ISessionStorage {
	public readonly NAMESPACE = "SESSION:" as "SESSION";
}
