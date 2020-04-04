import { Field, ID, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
export class User {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => ID)
  id: string;
}
