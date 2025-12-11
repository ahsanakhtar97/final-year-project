import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import  {HabitStatus} from "../enums/habit-status.enum";
import { UserHabit } from "src/user-habits/entities/user-habit.entity";

@Entity('habit_logs')
export class HabitLog {
    @PrimaryGeneratedColumn({name:'log_id'})
    logId:number;
    @Column({name:'user_habit_id'})
    userHabitId:number;

    @Column({name:'date'})
    date:Date;

    @Column({name:'status',enum:HabitStatus})
    habitStatus:HabitStatus

    @ManyToOne(()=>UserHabit,(userHabit)=>userHabit.habitLogs,{onDelete:'CASCADE'})
    @JoinColumn({name:'user_habit_id'})
    userHabit:UserHabit;
}
