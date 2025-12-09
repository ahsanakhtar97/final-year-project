import { Task } from "src/tasks/entities/task.entity";
import { UserHabit } from "src/user-habits/entities/user-habit.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @OneToMany(()=> Task, (task)=>task.user)
    tasks:Task[]

    @OneToMany(()=>UserHabit,(userhabit)=>userhabit.user)
    userHabits:UserHabit[]
}
