/**
 * Internal DTO — represents a user whose credentials have already been
 * verified by LocalStrategy. Never exposed directly to clients.
 */
export class SignInDto {
  userId!: number;
  name!: string;
  email!: string;
}
