// Shape returned by the backend's /users endpoints. The backend returns
// `userId` (not `id`); keep it that way so we don't have to remap.
export interface User {
  userId: number;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}
