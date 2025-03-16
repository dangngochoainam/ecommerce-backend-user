import {CallHandler, createParamDecorator, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";
import {Request} from "express";
import {catchError, map, Observable, of} from "rxjs";
import {HEADER, TRACE_ID} from "src/shared/constants/http.constant";
import {v4} from "uuid";
import {ContextLogger, LoggerService} from "../logger/logger.service";

export const TraceId = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.headers[HEADER.TRACE_ID];
});

@Injectable()
export class SetTraceIdInterceptor implements NestInterceptor {
    protected logger!: ContextLogger;

    constructor(protected readonly loggerService: LoggerService) {
        this.logger = loggerService.newContextLogger(this.constructor.name);
    }

    public intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
        const start = new Date();
        const req: Request = context.switchToHttp().getRequest();

        if (!req.headers[HEADER.TRACE_ID]) {
            req.headers[HEADER.TRACE_ID] = v4() as string;
            if (req.body[TRACE_ID]) {
                req.headers[HEADER.TRACE_ID] = req.body[TRACE_ID];
            }
        }

        const traceId = req.headers[HEADER.TRACE_ID] as string;
        this.logger.info({traceId}, `Request: [${req.method}] - ${req.url} start`);

        return next.handle().pipe(
            map((data) => {
                const end = new Date();
                this.logger.log(
                    {traceId},
                    `Request: [${req.method}] - ${req.url} end after ${end.getTime() - start.getTime()} ms`,
                );
                return data;
            }),
            catchError((err) => {
                const end = new Date();
                this.logger.log(
                    {traceId},
                    `Request: [${req.method}] - ${req.url} end after ${end.getTime() - start.getTime()} ms - ERROR`,
                );
                return of(err);
            }),
        );
    }
}
