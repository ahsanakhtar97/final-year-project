export enum HabitStatus{
    NOT_COMPLETED='not_completed',
    COMPLETED='completed'
}
export interface CreateHabitLogPayload{
    userHabitId:number;
    date:string;
    status:HabitStatus

}