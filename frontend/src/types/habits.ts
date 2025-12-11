
export interface Habit {
    habitId:number;
    habitName:string;
    categoryId:number;

};

export interface HabitStat{
    habitId:number;
    habitName:string;
    completed:number;
    total:number;
    percentage:number;
}

export interface HabitStreak{
    habitId:number;
    habitName:string;
    currentStreak:number;
    longestStreak:number;
}

export interface HabitComplete{
    date:Date;
    completed:number;
}

