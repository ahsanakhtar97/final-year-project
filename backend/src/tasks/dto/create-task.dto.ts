import { TaskStatus } from "../enums/task-status.enum";

export class CreateTaskDto {
    userId:number;
    title:string;
    description:string;
    status:TaskStatus;
}
