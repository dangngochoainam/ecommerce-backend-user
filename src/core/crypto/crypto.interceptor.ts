import {
	BadRequestException,
	CallHandler,
	ExecutionContext,
	HttpException,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import { catchError, map, Observable, of } from "rxjs";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { NON_ENCRYPTION_KEY } from "./crypto.decorator";
import { CryptoService } from "./crypto.service";

@Injectable()
export class CryptoInterceptor implements NestInterceptor {
	private logger!: ContextLogger;

	public constructor(
		protected readonly loggerService: LoggerService,
		private readonly cryptoService: CryptoService,
		private readonly reflector: Reflector,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		try {
			const request: Request = context.switchToHttp().getRequest();
			const response: Response = context.switchToHttp().getResponse();

			const contentType = request.headers["content-type"];

			const NON_ENCRYPTION = this.reflector.get(NON_ENCRYPTION_KEY, context.getHandler());
			if (NON_ENCRYPTION && contentType === "application/json") {
				return next.handle();
			}

			if (!NON_ENCRYPTION) {
				if (contentType !== "application/octet-stream") {
					const error = new Error("Invalid content-type");
					this.logger.error({}, "Invalid content-type", error);
					throw new BadRequestException(error.message);
				}

				const encryptionKey = request.headers["x-encryption-key"] as string;
				if (!encryptionKey) {
					const error = new Error("Missing encryption key");
					this.logger.error({}, "Missing encryption key", error);
					throw new BadRequestException(error.message);
				}

				const password = this.cryptoService.decryptRSA(Buffer.from(encryptionKey, "base64")).toString("utf-8");
				// TODO: how to client send data to server by application/octet-stream
				const body = this.cryptoService.decryptAES(Buffer.from(request.body, "base64"), password).toString();

				request.body = JSON.parse(body);

				return next.handle().pipe(
					map((val: unknown) => {
						return this.cryptoService
							.encryptAES(Buffer.from(JSON.stringify(val || ""), "utf8"), password)
							.toString("base64");
					}),
					catchError((err: HttpException) => {
						response.status(err.getStatus());
						return of(
							this.cryptoService
								.encryptAES(Buffer.from(JSON.stringify(err || ""), "utf8"), password)
								.toString("base64"),
						);
					}),
				);
			}

			return next.handle();
		} catch (error: any) {
			this.logger.error({}, `CryptoInterceptor Error`, error);
			throw new BadRequestException(error.message);
		}
	}
}
