
import { HabitLog } from "../../habit-logs/entities/habit-log.entity";
import { Habit } from "../../habits/entities/habit.entity";
import { User } from "../../users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_habits')
export class UserHabit {
    @PrimaryGeneratedColumn({name:'user_habit_id'})
    userHabitId:number;

    @Column({name:'habit_id'})
    habitId:number;

    @Column({name:'user_id'})
    userId:number;

    // OPTION: Allow nullable so existing rows don't crash the migration
    @Column({ name: 'start_date', type: 'timestamp', nullable: true })
    startDate: Date;

    @ManyToOne(()=>User,(user)=>user.userHabits,{onDelete:'CASCADE'})
    @JoinColumn({name:'user_id'})
    user:User;

    @ManyToOne(()=>Habit,(habit)=>habit.userHabits,{onDelete:'CASCADE'})
    @JoinColumn({name:'habit_id'})
    habit:Habit;

    // Inside the UserHabit class, add this relation:
    @OneToMany(() => HabitLog, (habitLog) => habitLog.userHabit)
    habitLogs: HabitLog[]; // This matches the "(userHabit) => userHabit.habitLogs" in your other file
}
