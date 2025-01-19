export enum METHOD {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
}

export abstract class DTO {
	public abstract paramsDTO: any;
	public abstract queryDTO: any;
	public abstract bodyDTO: any;
	public abstract readonly url: string;
	public abstract readonly method: METHOD;
	public abstract readonly responseDTOClass: Constructor<any>;
	public headers?: Record<string, any>;

	public get interpolatedUrl(): string {
		let url = this.url;
		if (this.paramsDTO) {
			Object.keys(this.paramsDTO).forEach((key) => {
				url = url.replace(":" + key, this.paramsDTO[key] !== undefined ? String(this.paramsDTO[key]) : "");
			});
		}
		if (this.queryDTO) {
			Object.keys(this.queryDTO).forEach((key, index) => {
				if (this.queryDTO[key] !== undefined) {
					url += (index === 0 ? "?" : "&") + key + "=" + String(this.queryDTO[key]);
				}
			});
		}
		return url;
	}
}

export class ResponseDTO<T> {
	public instanceId?: string;

	constructor(
		public data: T,
		public message: string,
		public systemCode: string,
		public debugError?: T,
	) {}
}

export class ErrorDetailWithParams {
	constructor(
		public code: string,
		public params: Record<string, string>,
		public data?: unknown,
	) {}
}

export class ResponseErrorDetailDTO<T> extends ResponseDTO<T> {
	constructor(
		public message: string,
		public systemCode: string,
		public data: T,
		public debugError?: T,
	) {
		super(data, message, systemCode, undefined);
	}
}
