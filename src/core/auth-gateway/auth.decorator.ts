import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { BaseJwtSession } from "./auth-session.service";

export const JWTContent = createParamDecorator((_: undefined, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	if (!request.token) {
		throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
	}
	return request.token;
});

export const JWTSession = createParamDecorator(
	(sessionType: ClassConstructor<BaseJwtSession>, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		if (!request.session) {
			throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
		}
		return plainToInstance(sessionType, request.session, { exposeDefaultValues: true });
	},
);
