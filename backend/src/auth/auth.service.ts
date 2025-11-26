import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthInputDto } from './dto/auth-input.dto';
import { AuthResultDto } from './dto/auth-result.dto';
import { SignInDto } from './dto/sign-in.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService:UsersService,private readonly jwtService:JwtService){}
  async authenticate(input:AuthInputDto):Promise<AuthResultDto>{
    const user=await this.validateUser(input);
    if(!user){  
      throw new UnauthorizedException("Incorrect email or password");
    }
    return await this.signIn(user);
    
  }


  
  async validateUser(input:AuthInputDto):Promise<SignInDto|null>{
    const user=await this.usersService.findOneByEmail(input.email);
    if(user){
      const isMatch=await bcrypt.compare(input.password,user.passwordHash)
      if(isMatch)
      return {
        userId:user.userId,
        name:user.name,
        email:user.email
      };
    }
    return null;
  }

  async login(user:User){
    const payload={email:user.email,}
  }

  async signIn(user:SignInDto):Promise<AuthResultDto>{
  const tokenPayload={
    sub:user.userId,
    name:user.name,
    email:user.email
  };
  const accessToken=await this.jwtService.signAsync(tokenPayload);
  return {
    accessToken,
    userId:user.userId,
    name:user.name,
    email:user.email
  }
}
async register(user:RegisterDto):Promise<AuthResultDto>{
  const exists=await this.usersService.findOneByEmail(user.email);
  if(exists) throw new ConflictException('User already exists');
  const passwordHash=await bcrypt.hash(user.password,10);
  const newUser=await this.usersService.create({
    ...user,
    passwordHash:passwordHash
  });
  console.log(newUser);
  return await this.authenticate({email:user.email,password:user.password});
}
}

