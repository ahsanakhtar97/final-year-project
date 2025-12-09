export enum TaskStatus{
    TO_DO='to_do',
    IN_PROGRESS='in_progress',
    COMPLETED='completed'
};

export interface Task {
  taskId: number;
  userId:number;
  title: string;
  description: string;
  taskStatus:TaskStatus;
};

export interface CreateTaskPayload{
    userId:number;
    title:string;
    description:string;
    taskStatus:TaskStatus
}
