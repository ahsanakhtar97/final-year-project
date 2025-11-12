import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { AuthInputDto } from './dto/auth-input.dto';
import { AuthResultDto } from './dto/auth-result.dto';
import { SignInDto } from './dto/sign-in.dto';
import * as bcrypt from 'bcrypt';
import { NotFoundError } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(Auth) private readonly authRepository:Repository<Auth>,private readonly usersService:UsersService){}
 async authenticate(authInput:AuthInputDto):Promise<AuthResultDto>{
    const user=await this.validateUser(authInput);
    if(user){
      return {
        accessToken:'fake-access',
        user
      };
    }
  }
  async validateUser(input:AuthInputDto):Promise<SignInDto|null>{
    const user=await this.usersService.findOneByEmail(input.email);
    if(!user) throw new NotFoundException(`User with email ${input.email} on found`);
    // Get password hash
    const auth=await this.findByUserId(user.userId);
    if(!auth) throw new InternalServerErrorException('Something went wrong'); // Not possible
    const localAuth=auth.find(u=>u.provider=='local');
    if(!localAuth) throw new UnauthorizedException('This email is connected with Google. Please use that to log in');
    if(bcrypt.compareSync(input.password,localAuth.passwordHash)){
      
    }
  }
async findByUserId(userId:number):Promise<Auth[]>{
  return await this.authRepository.find({where:{userId:userId}});
}
}
