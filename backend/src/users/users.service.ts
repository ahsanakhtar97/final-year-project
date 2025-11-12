import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';


@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }
  async create(createUserDto: CreateUserDto) {
  try {
    await this.userRepository.insert(createUserDto);
    return { message: 'New user created successfully' };
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictException('User with this email already exists');
    }
    throw new InternalServerErrorException('Something went wrong');
  }
}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOneById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { userId: id } });
  }
  // Find A user by his email
  async findOneByEmail(email:string):Promise<User|null>{
    return await this.userRepository.findOne({where:{email}});
  }

  /*
  remove(id: number) {
    return `This action removes a #${id} user`;
  }
    */
}
