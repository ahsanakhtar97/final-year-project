import { User } from "src/users/entities/user.entity";

export class AuthResultDto{
    accessToken:string;
    user:User;
}