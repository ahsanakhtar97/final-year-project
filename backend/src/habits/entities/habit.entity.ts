import { Category } from "../../categories/entities/category.entity";
import { UserHabit } from "../../user-habits/entities/user-habit.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('habits')
export class Habit {
    @PrimaryGeneratedColumn({name:'habit_id'})
    habitId:number;

    @Column({name:'habit_name'})
    habitName:string;

    @Column({name:'category_id'})
    categoryId:number;

    @ManyToOne(()=>Category,(category)=>category.habits,{onDelete:'CASCADE'})
    @JoinColumn({name:'category_id'})
    category:Category;

    @OneToMany(()=>UserHabit,(userHabits)=>userHabits.habit)
    userHabits:UserHabit[]
}
