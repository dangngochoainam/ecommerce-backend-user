import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    HttpException,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import {Reflector} from "@nestjs/core";
import {Request, Response} from "express";
import {catchError, map, Observable, of} from "rxjs";
import {ContextLogger, LoggerService} from "../logger/logger.service";
import {NON_ENCRYPTION_KEY} from "./crypto.decorator";
import {CryptoService} from "./crypto.service";
import {CONTENT_TYPE} from "src/shared/enums/http";
import {HEADER} from "src/shared/constants/http.constant";

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
            if (NON_ENCRYPTION && contentType === CONTENT_TYPE.APPLICATION_JSON) {
                return next.handle();
            }

            if (!NON_ENCRYPTION) {
                // TODO: use Octet stream
                // if (contentType !== CONTENT_TYPE.APPLICATION_OCTET_STREAM) {
                //     const error = new Error("Invalid content-type");
                //     this.logger.error({}, "Invalid content-type", error);
                //     throw new BadRequestException(error.message);
                // }

                const encryptionKey = request.headers[HEADER.ENCRYPTION_KEY] as string;
                if (!encryptionKey) {
                    const error = new Error("Missing encryption key");
                    this.logger.error({}, "Missing encryption key", error);
                    throw new BadRequestException(error.message);
                }

                const password = this.cryptoService.decryptRSA(Buffer.from(encryptionKey, "base64")).toString("utf-8");
                const body = this.cryptoService.decryptAES(Buffer.from(request.body.data, "base64"), password);
                request.body = JSON.parse(body.toString("utf-8"));

                return next.handle().pipe(
                    map((val: unknown) => {
                        response.status(200)
                        return {
                            data: this.cryptoService
                                .encryptAES(Buffer.from(JSON.stringify(val || ""), "utf8"), password).toString("base64")
                        }
                    }),
                    catchError((err: HttpException) => {
                        response.status(err.getStatus());
                        return of(
                            this.cryptoService
                                .encryptAES(Buffer.from(JSON.stringify(err || ""), "utf8"), password).toString("base64")
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
