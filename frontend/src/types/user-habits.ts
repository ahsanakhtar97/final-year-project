export interface CreateUserHabitPayload{
    habitId:number;
    userId:number;
};

export interface UserHabit{
    userHabitId:number;
    userId:number;
    habitId:number;
    startDate:Date;
}
