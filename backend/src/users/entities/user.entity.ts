import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn({ name: 'user_id' })
    userId: number;

    @Column({ name: 'name'})
    name: string;

    @Column({ name: 'email', unique: true})
    email: string;

    @Column({name:'password_hash',unique:true})
    passwordHash:string;
}
