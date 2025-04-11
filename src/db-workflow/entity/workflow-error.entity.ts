import { BaseEntity } from "src/core/entity/base-entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { PrimaryGeneratedColumn } from "typeorm/index";
import { WorkflowEntity } from "./workflow.entity";

@Entity("workflow_error")
export class WorkflowErrorEntity extends BaseEntity {
	@PrimaryGeneratedColumn({ name: "id", primaryKeyConstraintName: "workflow_error_pkey" })
	public id!: string;

	@Index({ unique: true })
	@Column({ name: "correlation_id" })
	public correlationID!: string;

	@Column({ name: "workflow_name", type: "varchar" })
	public workflowName!: string;

	@Column({ type: "jsonb" })
	public error?: object;

	@Column()
	public stack?: string;

	@Column({ name: "workflow_id" })
	public workflowId!: string;

	@ManyToOne(() => WorkflowEntity, (workflow) => workflow.wfErrors, { eager: false })
	@JoinColumn({ name: "workflowId", referencedColumnName: "id" })
	public workflow?: WorkflowEntity;
}

// CREATE UNIQUE INDEX workflow_error_primary__uindex ON transit.transient_payload USING btree (correlation_id, workflow_name);
