import { BaseEntity } from "src/core/entity/base-entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
	name: "transient_payload",
})
export class TransientPayloadEntity extends BaseEntity {
	@PrimaryGeneratedColumn({ name: "id", primaryKeyConstraintName: "transient_payload_pkey" })
	public id!: string;

	@Column({ name: "correlation_id" })
	public correlationID!: string;

	@Column({ name: "workflow_name", type: "varchar" })
	public workflowName!: string;

	@Column({ type: "jsonb" })
	public payload?: unknown;
}

// CREATE UNIQUE INDEX transient_payload_primary__uindex ON transit.transient_payload USING btree (correlation_id, workflow_name);
