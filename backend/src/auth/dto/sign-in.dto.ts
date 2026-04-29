import { UserRole } from '../../users/enums/user-role.enum';

export class SignInDto {
  userId!: number;
  name!: string;
  email!: string;
  role!: UserRole;
}
