import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { DTO, ResponseDTO } from "src/shared/dto/base.dto";
import { CONTENT_TYPE } from "src/shared/enums/http";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { plainToInstance } from "class-transformer";

export interface IFetchOptions {
	hostname: string;
}

@Injectable()
export class FetchService {
	protected logger!: ContextLogger;
	private readonly hostName: string;

	constructor(
		protected readonly loggerService: LoggerService,
		opts: IFetchOptions,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
		this.hostName = opts.hostname;
	}

	public async call<T extends DTO>(
		data: DTO,
		headers?: object,
		traceId?: string,
	): Promise<T["responseDTOClass"]["prototype"]> {
		const url = `${this.hostName}/${data.interpolatedUrl}`;
		const body = JSON.stringify(data.bodyDTO);
		this.logger.log({ traceId }, `REQUEST TO URL => ${url}`);
		this.logger.debug({ traceId }, `REQUEST TO URL => ${url}\n- Body: ${JSON.stringify(body)}`);
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

		const responseData = await response.json();
		this.logger.debug({ traceId }, `RESPONSE FROM URL ${url}\n: ${JSON.stringify(responseData)}`);
		return plainToInstance(data.responseDTOClass as T["responseDTOClass"]["prototype"], responseData);
	}

	public async callRaw(data: DTO, headers?: object, traceId?: string): Promise<Response> {
		const url = `${this.hostName}/${data.interpolatedUrl}`;
		const body = JSON.stringify(data.bodyDTO);
		this.logger.log({ traceId }, `REQUEST TO URL => ${url}`);
		this.logger.debug({ traceId }, `REQUEST TO URL => ${url}\n- Body: ${JSON.stringify(body)}`);
		const response = await fetch(url, {
			body,
			method: data.method,
			headers: {
				"Content-Type": CONTENT_TYPE.APPLICATION_JSON,
				...headers,
			},
		});
		this.logger.debug({ traceId }, `RESPONSE FROM URL ${url} is OK: ${JSON.stringify(response.ok)}`);
		return response.json();
	}

	public async upload<R>(data: DTO, formData: FormData, headers?: object): Promise<ResponseDTO<R>> {
		const url = `${this.hostName}/${data.url}`;
		for (const [key, value] of Object.entries(data.bodyDTO as object)) {
			if (value) {
				formData.append(key, String(value));
			}
		}
		this.logger.debug({}, `REQUEST TO URL => ${url}\n- Body: ${JSON.stringify(data.bodyDTO)}`);
		const response = await fetch(url, {
			body: formData,
			method: data.method,
			headers: { ...headers },
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
