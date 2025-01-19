import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ISqlLoggerPayload, SQL_LOGGER_TYPE } from "../../core/logger/sql-logger.payload";

@Entity("log")
export class LogEntity implements ISqlLoggerPayload {
	@PrimaryGeneratedColumn()
	public id!: string;

	@CreateDateColumn()
	@Column({ name: "timestamp", type: "timestamp with time zone", default: () => "CURRENT_TIMESTAMP" })
	public timestamp!: Date;

	@Column({ name: "instance_id" })
	public instanceId!: string;

	@Column()
	public name?: string;

	@Column({ type: "text", nullable: true })
	public context?: string;

	@Column()
	public type!: SQL_LOGGER_TYPE;

	@Column({ name: "trace_id", nullable: true })
	public traceId?: string;

	@Column({ type: "text" })
	public message!: string;
}
