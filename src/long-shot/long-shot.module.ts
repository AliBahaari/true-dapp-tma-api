import { Module } from '@nestjs/common';
import { LongShotService } from './long-shot.service';
import { LongShotController } from './long-shot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LongShotLeaguesWeeklyEntity } from './entities/long-shot-leagues-weekly.entity';
import { LongShotMatchesEntity } from './entities/long-shot-matches.entity';
import { LongShotParticipantsEntity } from './entities/long-shot-participants.entity';
import { UsersModule } from 'src/users/users.module';
import { LongShotPacksEntity } from './entities/long-shot-packs.entity';
import { LongShotTicketEntity } from './entities/long-shot-tickets.entity';
import { LongShotTeamEntity } from './entities/long-shot-teams.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LongShotPacksEntity,
      LongShotLeaguesWeeklyEntity,
      LongShotMatchesEntity,
      LongShotParticipantsEntity,
      LongShotTicketEntity,
      LongShotTeamEntity
    ]),
    UsersModule,
  ],
  controllers: [LongShotController],
  providers: [LongShotService],
})
export class LongShotModule {}
