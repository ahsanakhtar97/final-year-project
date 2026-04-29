import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { UserRole } from '../users/enums/user-role.enum';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

interface AuthedRequest extends Request {
  user: { userId: number; role: UserRole; name: string; email: string };
}

@ApiTags('appointments')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'appointments', version: '1' })
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment request.' })
  create(@Req() req: AuthedRequest, @Body() dto: CreateAppointmentDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: "All appointments involving the current user." })
  mine(@Req() req: AuthedRequest) {
    return this.service.findForUser(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single appointment.' })
  findOne(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment status, time, or note.' })
  update(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.service.update(id, req.user.userId, req.user.role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hard-delete an appointment row.' })
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, req.user.userId);
  }
}
