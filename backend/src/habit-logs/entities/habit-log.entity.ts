import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import  {HabitStatus} from "../enums/habit-status.enum";

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
    
}
