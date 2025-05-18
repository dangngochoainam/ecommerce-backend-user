import { BaseEntity } from "src/core/entity/base-entity";
import { AbstractWorkflowEntity } from "src/core/workflow/workflow-entity";
import { WORKFLOW_STATUS } from "src/core/workflow/workflow-type";
import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { WorkflowErrorEntity } from "./workflow-error.entity";

@Entity({
	name: "workflow",
})
export class WorkflowEntity extends BaseEntity implements AbstractWorkflowEntity {
	@PrimaryGeneratedColumn("uuid", { name: "id", primaryKeyConstraintName: "workflow_pkey" })
	public id!: string;

	@Column({ name: "correlation_id", type: "varchar" })
	public correlationId!: string;

	@Column({ name: "service_name", type: "varchar" })
	public serviceName!: string;

	@Column({ name: "workflow_name", type: "varchar" })
	public workflowName!: string;

	@Column({ name: "version" })
	public version!: string;

	@Column({ name: "max_attempt" })
	public maxAttempt!: number;

	@Column({ name: "current_attempt" })
	public currentAttempt!: number;

	@Column({ name: "finished", type: "boolean", default: false })
	public finished!: boolean;

	@Column({ name: "pending_reset", type: "boolean", default: false })
	public pendingReset!: boolean;

	@Column({ name: "status" })
	public status!: WORKFLOW_STATUS;

	@Column({ name: "cycle" })
	public cycle!: number;

	@OneToMany(() => WorkflowErrorEntity, (wfError) => wfError.workflow, {
		eager: false,
		cascade: ["remove"],
		onDelete: "CASCADE",
	})
	@JoinColumn({ name: "id", referencedColumnName: "workflowId" })
	public wfErrors?: WorkflowErrorEntity[];
}

// CREATE UNIQUE INDEX workflow_primary__uindex ON workflow.workflow USING btree (correlation_id, workflow_name, service_name);
