import { Habit } from "../../habits/entities/habit.entity";
import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn({name:'category_id'})
    categoryId:number

    @Column({name:'category_name'})
    categoryName:string;
    
    @OneToMany(()=>Habit,(habit)=>habit.category)
    @JoinColumn({name:'habit_id'})
    habits:Habit[];
}
