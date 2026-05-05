export enum TaskStatus {
  TO_DO       = 'to_do',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
}

export enum TaskPriority {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
}

export interface Task {
  taskId:       number;
  userId:       number;
  title:        string;
  description:  string;
  taskStatus:   TaskStatus;
  priority:     TaskPriority;
  dueDate:      string | null;
  completedAt:  Date | string | null;
  focusMinutes: number;
  createdAt?:   string;
}

export interface CreateTaskPayload {
  userId:      number;
  title:       string;
  description: string;
  taskStatus:  TaskStatus;
  priority?:   TaskPriority;
  dueDate?:    string | null;
}

export interface UpdateTaskPayload {
  title?:       string;
  description?: string;
  priority?:    TaskPriority;
  dueDate?:     string | null;
}
