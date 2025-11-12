import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { authProvider } from "../enums/authProvider.enum";
@Entity('auth')
export class Auth {

    @PrimaryGeneratedColumn({name:'auth_id',type:'integer'})
    authId:number;

    @Column({name:'user_id',type:'integer'})
    userId:number;
    @Column({name:'provider',type:'enum',enum:authProvider,default:'local'})
    provider:authProvider;

    @Column({name:'email',type:'varchar'})
    email:string;

    @Column({name:'password_hash',type:'varchar',nullable:false})
    passwordHash:string;
}
