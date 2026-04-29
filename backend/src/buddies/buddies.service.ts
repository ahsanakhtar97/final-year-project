import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuddyConnection, BuddyStatus } from './entities/buddy-connection.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BuddiesService {
  constructor(
    @InjectRepository(BuddyConnection)
    private readonly buddyRepository: Repository<BuddyConnection>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserBuddies(userId: number) {
    return this.buddyRepository.find({
      where: [
        { requesterId: userId },
        { receiverId: userId }
      ],
      relations: ['requester', 'receiver']
    });
  }

  async sendRequest(requesterId: number, receiverId: number) {
    if (requesterId === receiverId) throw new BadRequestException("Can't be your own buddy");
    const receiver = await this.userRepository.findOne({ where: { userId: receiverId }});
    if (!receiver) throw new NotFoundException("User not found");

    const existing = await this.buddyRepository.findOne({
      where: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId }
      ]
    });
    if (existing) throw new BadRequestException("Connection already exists or is pending");

    const conn = this.buddyRepository.create({ requesterId, receiverId });
    return this.buddyRepository.save(conn);
  }

  async acceptRequest(connectionId: number) {
    const conn = await this.buddyRepository.findOne({ where: { connectionId } });
    if (!conn) throw new NotFoundException("Connection request not found");
    conn.status = BuddyStatus.ACCEPTED;
    return this.buddyRepository.save(conn);
  }
}
