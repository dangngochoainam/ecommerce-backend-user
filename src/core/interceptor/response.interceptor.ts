import {CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor} from "@nestjs/common";
import {Request, Response} from "express";
import {catchError, map, Observable, of} from "rxjs";
import {ErrorDetailWithParams, ResponseDTO} from "src/shared/dto/base.dto";
import {SYSTEM_CODE} from "src/shared/dto/code/system-code";
import {CoreEnvironment, CoreEnvironmentService} from "../environment/environment.service";
import {ContextLogger, LoggerService} from "../logger/logger.service";

export type ALL_CODE<T extends string> = SYSTEM_CODE | T;

export type CODE_ENUM_MAP<C extends string> = {
    [k in keyof C]: C[k];
};

@Injectable()
export class BaseResponseInterceptor<T, EXTRA_CODE extends string = SYSTEM_CODE>
    implements NestInterceptor<T, ResponseDTO<T>> {
    protected logger!: ContextLogger;

    constructor(
        protected readonly loggerService: LoggerService,
        protected readonly envService: CoreEnvironmentService<CoreEnvironment>,
    ) {
        this.logger = loggerService.newContextLogger(this.constructor.name);
    }

    public CODE: CODE_ENUM_MAP<ALL_CODE<EXTRA_CODE>> = SYSTEM_CODE as unknown as CODE_ENUM_MAP<ALL_CODE<EXTRA_CODE>>;

    public intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDTO<T>> {
        const start = new Date();

        const req: Request = context.switchToHttp().getRequest();
        const res: Response = context.switchToHttp().getResponse();

        this.logger.info({}, `Request: [${req.method}] - ${req.url} start`);

        return next.handle().pipe(
            map((data) => {
                const end = new Date();
                this.logger.log(
                    {},
                    `Request: [${req.method}] - ${req.url} end after ${end.getTime() - start.getTime()} ms`,
                );
                return this.translateResponse(SYSTEM_CODE.SUCCESS, data, undefined, req.url) as ResponseDTO<T>;
            }),
            catchError((err: HttpException | Error) => {
                const end = new Date();

                this.logger.log(
                    {},
                    `Request: [${req.method}] - ${req.url} end after ${end.getTime() - start.getTime()} ms - ERROR`,
                );
                this.logger.debug({}, err);
                this.logger.debug({}, err.message);
                this.logger.debug({}, err.stack);

                let httpCode: number = 500;
                if (err instanceof HttpException) {
                    httpCode = err && err.getStatus ? err.getStatus() : httpCode;
                    res.status(httpCode);
                    const errorResponse = err.getResponse();
                    const errorMessage = errorResponse instanceof ErrorDetailWithParams ? errorResponse : err.message;
                    return of(this.translateResponse(errorMessage, err) as ResponseDTO<T>);
                } else {
                    httpCode = res.statusCode;
                }
                let systemCode = SYSTEM_CODE.SORRY_SOMETHING_WENT_WRONG;
                if (httpCode === 400) {
                    systemCode = SYSTEM_CODE.BAD_REQUEST;
                } else if (httpCode === 401) {
                    systemCode = SYSTEM_CODE.UNAUTHORIZED;
                } else if (httpCode === 403) {
                    systemCode = SYSTEM_CODE.FORBIDDEN;
                } else if (httpCode < 300) {
                    res.status(500);
                }
                return of(this.translateResponse(systemCode, err.message, err, req.url) as ResponseDTO<T>);
            }),
        );
    }

    protected translateResponse(
        errorDetail: string | ErrorDetailWithParams,
        data?: unknown,
        debugError?: unknown,
        url?: string,
    ): ResponseDTO<unknown> {
        let errorRes = data;
        let code = errorDetail;
        let params: Record<string, string> = {};
        if (errorDetail instanceof ErrorDetailWithParams) {
            code = errorDetail.code;
            params = errorDetail.params;
            errorRes = errorDetail.data || data;
        }
        const systemCode: ALL_CODE<EXTRA_CODE> = (
            Object.values(this.CODE).includes(code as ALL_CODE<EXTRA_CODE>)
                ? code
                : SYSTEM_CODE.PLEASE_THROW_SYSTEM_CODE
        ) as ALL_CODE<EXTRA_CODE>;
        if (systemCode === SYSTEM_CODE.PLEASE_THROW_SYSTEM_CODE) {
            this.logger.error(
                {
                    traceId: url,
                },
                `Please add system code for: ${data}`,
                new Error(),
            );
        }
        const resp: ResponseDTO<unknown> = {
            systemCode,
            message: "Yêu cầu của bạn đã được xử lý thành công.",
            // TODO: do locales
            // message: this.systemcodeTransMap[systemCode](t, params),
            data: errorRes,
        };
        this.logger.info({}, `Params: ${JSON.stringify(params)}`);
        if (systemCode !== SYSTEM_CODE.SUCCESS && this.envService.ENVIRONMENT.SHOW_DEBUG_ERROR) {
            resp.debugError = debugError;
        }
        return resp;
    }
}
