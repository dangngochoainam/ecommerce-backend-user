import {Inject, Injectable, InternalServerErrorException, OnModuleInit} from "@nestjs/common";
import {ContextLogger, LoggerService} from "src/core/logger/logger.service";
import {DTO, ResponseDTO} from "src/shared/dto/base.dto";
import {CONTENT_TYPE} from "src/shared/enums/http";
import {SYSTEM_CODE} from "src/shared/dto/code/system-code";
import {plainToInstance} from "class-transformer";

export const FETCH_CONFIG_PROVIDER = Symbol("FETC_CONFIG_PROVIDER");

export interface IFetchOptions {
    targetHost: string;
}

@Injectable()
export class FetchService implements OnModuleInit {
    protected logger!: ContextLogger;
    private readonly targetHost: string;

    public constructor(
        protected readonly loggerService: LoggerService,
        @Inject(FETCH_CONFIG_PROVIDER) protected fetchOptions: IFetchOptions,
    ) {
        this.logger = loggerService.newContextLogger(this.constructor.name);
        this.targetHost = fetchOptions.targetHost;
    }

    public async onModuleInit(): Promise<void> {
        if (!this.targetHost) {
            this.logger.warn({}, `Missing target host: ${this.targetHost}`);
        }
        this.logger.debug({}, `Creating context for ${this.constructor.name} with host: ${this.targetHost}`);
    }

    protected customizeResponseFormat<T>(input: ResponseDTO<T>): T {
        return input.data;
    }

    public async call<T extends DTO>(
        data: DTO,
        headers?: object,
        traceId?: string,
    ): Promise<T["responseDTOClass"]["prototype"]> {
        const url = `${this.targetHost}/${data.interpolatedUrl}`;
        const body = JSON.stringify(data.bodyDTO);
        this.logger.log({traceId}, `REQUEST TO URL => ${url}`);
        this.logger.debug({traceId}, `REQUEST TO URL => ${url}\n- Body: ${JSON.stringify(body)}`);
        const response = await fetch(url, {
            body,
            method: data.method,
            headers: {
                "Content-Type": CONTENT_TYPE.APPLICATION_JSON,
                ...headers,
            },
        });

        if (!response.ok) {
            this.logger.error(
                {},
                `RESPONSE FROM URL => ${url} failed with reason => ${await response?.text()}`,
                undefined,
            );
            throw new InternalServerErrorException(SYSTEM_CODE.FETCH_REQUEST_FAILED);
        }

        const rawResponse = await response.json();
        this.logger.debug({traceId}, `RESPONSE FROM URL ${url}\n: ${JSON.stringify(rawResponse)}`);
        const responseData = this.customizeResponseFormat(rawResponse);
        return plainToInstance(data.responseDTOClass as T["responseDTOClass"]["prototype"], responseData);
    }

    public async callRaw(data: DTO, headers?: object, traceId?: string): Promise<Response> {
        const url = `${this.targetHost}/${data.interpolatedUrl}`;
        const body = JSON.stringify(data.bodyDTO);
        this.logger.log({traceId}, `REQUEST TO URL => ${url}`);
        this.logger.debug({traceId}, `REQUEST TO URL => ${url}\n- Body: ${body}`);
        const response = await fetch(url, {
            body,
            method: data.method,
            headers: {
                "Content-Type": CONTENT_TYPE.APPLICATION_JSON,
                ...headers,
            },
        });
        const responseData = await response.json();
        this.logger.debug({traceId}, `RESPONSE FROM URL ${url} is OK: ${JSON.stringify(responseData)}`);
        return responseData;
    }

    public async upload<R>(data: DTO, formData: FormData, headers?: object): Promise<ResponseDTO<R>> {
        const url = `${this.targetHost}/${data.url}`;
        for (const [key, value] of Object.entries(data.bodyDTO as object)) {
            if (value) {
                formData.append(key, String(value));
            }
        }
        this.logger.debug({}, `REQUEST TO URL => ${url}\n- Body: ${JSON.stringify(data.bodyDTO)}`);
        const response = await fetch(url, {
            body: formData,
            method: data.method,
            headers: {...headers},
        });

        if (!response.ok) {
            this.logger.error(
                {},
                `Request to url => ${url} failed with reason => ${JSON.stringify(response)}`,
                undefined,
            );
            throw new InternalServerErrorException(SYSTEM_CODE.FETCH_REQUEST_FAILED);
        }

        const responseData = await response.json();
        this.logger.debug({}, `RESPONSE FROM URL => ${JSON.stringify(responseData)}`);
        return responseData as ResponseDTO<R>;
    }
}
