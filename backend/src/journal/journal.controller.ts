import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalService } from './journal.service';

@ApiTags('journal')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'journal', version: '1' })
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a journal entry. Runs sentiment analysis by default and stores the bilingual feedback alongside the text.',
  })
  create(@Body() dto: CreateJournalEntryDto): Promise<JournalEntry> {
    return this.journalService.create(dto);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: "Return a user's entries, most recent first.",
  })
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<JournalEntry[]> {
    return this.journalService.findByUser(userId);
  }

  @Get('user/:userId/mood')
  @ApiOperation({
    summary:
      "Average sentiment score across a user's most recent entries (default 7).",
  })
  @ApiQuery({ name: 'limit', required: false })
  averageSentiment(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string,
  ): Promise<{ average: number | null; count: number }> {
    const parsed = limit ? Math.max(1, Math.min(100, parseInt(limit, 10))) : 7;
    return this.journalService.averageSentiment(userId, parsed);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single journal entry by id.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<JournalEntry> {
    return this.journalService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a journal entry.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.journalService.remove(id);
  }
}
