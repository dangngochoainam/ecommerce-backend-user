import { Exclude, Expose } from "class-transformer";
import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";

@Exclude()
export abstract class BaseEntity {
	@Expose()
	@CreateDateColumn({ name: "created_at", type: "timestamp with time zone", default: () => "CURRENT_TIMESTAMP" })
	public createdAt!: Date;

	@Expose()
	@Column({ name: "created_user", nullable: true })
	public createdUser?: string;

	@Expose()
	@UpdateDateColumn({ name: "last_modified_at", type: "timestamp with time zone", default: () => "CURRENT_TIMESTAMP" })
	public lastModifiedAt!: Date;

	@Expose()
	@Column({ name: "last_modified_user", nullable: true })
	public lastModifiedUser?: string;

	@Expose()
	@DeleteDateColumn({ name: "deleted_at", type: "timestamp with time zone", nullable: true })
	public deletedAt?: Date;
}
