
import { Habit } from "src/habits/entities/habit.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity('user_habits')
export class UserHabit {
    @PrimaryGeneratedColumn({name:'user_habit_id'})
    userHabitId:number;

    @Column({name:'habit_id'})
    habitId:number;

    @Column({name:'user_id'})
    userId:number;

    @Column({name:'start_date'})
    startDate:Date;


    @ManyToOne(()=>User,(user)=>user.userHabits,{onDelete:'CASCADE'})
    @JoinColumn({name:'user_id'})
    user:User;

    @ManyToOne(()=>Habit,(habit)=>habit.userHabits,{onDelete:'CASCADE'})
    @JoinColumn({name:'habit_id'})
    habit:Habit;
}
