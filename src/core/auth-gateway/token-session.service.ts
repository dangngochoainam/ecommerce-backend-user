import { Injectable } from "@nestjs/common";
import { BaseJWTPayload } from "../auth/base-auth.service";
import { LoggerService } from "../logger/logger.service";
import { SessionRedisStorage } from "../session/session-storage.service";
import { BaseSessionService } from "../session/session.service";

@Injectable()
export class TokenSessionService extends BaseSessionService<"JWT_TOKEN", BaseJWTPayload> {
	public NAMESPACE: "JWT_TOKEN" = "JWT_TOKEN";

	public constructor(
		public storage: SessionRedisStorage,
		protected loggerService: LoggerService,
	) {
		super(storage, loggerService);
	}

	protected valueDeserializer = JSON.parse;

	protected valueSerializer = JSON.stringify;
}
