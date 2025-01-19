import { Exclude, Expose, Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { DTO, METHOD } from "./base.dto";

export const PAGING = {
	PAGE: 1,
	PAGE_SIZE: 15,
	ORDER_BY_ID: "id",
};

export enum Order {
	ASC = "ASC",
	DESC = "DESC",
}

@Exclude()
export class PagingResponseDTO<T> {
	@Expose()
	@IsArray()
	public list: T[];

	@Expose()
	@IsNumber()
	public currentPage: number;

	@Expose()
	@IsNumber()
	public totalPages: number;

	@Expose()
	@IsNumber()
	public totalItems?: number;

	public constructor(data: T[], currentPage: number, totalItems: number, pageSize: number) {
		this.list = data;
		this.totalItems = totalItems;
		this.currentPage = currentPage;
		this.totalPages = Math.ceil(totalItems / pageSize);
	}
}

@Exclude()
export class PagingRequestDTO {
	@Expose()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	public page: number = PAGING.PAGE;

	@Expose()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	@Max(50)
	public pageSize: number = PAGING.PAGE_SIZE;

	public get skip(): number {
		return (this.page - 1) * this.pageSize;
	}

	@Expose()
	@IsOptional()
	@IsEnum(Order)
	public order: Order = Order.ASC;

	@Expose()
	@IsOptional()
	@IsString()
	public orderBy: string = PAGING.ORDER_BY_ID;
}

export abstract class PagingDTO<T> extends DTO {
	public abstract readonly url: string;
	public abstract readonly method: METHOD;
	public abstract readonly responseDTOClass: Constructor<PagingResponseDTO<T>>;

	public abstract paramsDTO: any;
	public queryDTO!: PagingRequestDTO;
}
