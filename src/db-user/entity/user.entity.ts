import { Exclude, Expose } from "class-transformer";
import { BaseEntity } from "src/core/entity/base-entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import {IsEmail} from "class-validator";

@Exclude()
@Entity()
export class User extends BaseEntity {
	@Expose()
	@PrimaryGeneratedColumn("uuid", { name: "id" })
	public id!: string;

	@Expose()
	@IsEmail()
	@Column({ name: "email" })
	public email!: string;

	@Expose()
	@Column({ name: "password" })
	public password!: string;

	@Expose()
	@Column({ name: "name" })
	public name!: string;

	@Expose()
	@Column({ name: "phone" })
	public phone?: string;
}
