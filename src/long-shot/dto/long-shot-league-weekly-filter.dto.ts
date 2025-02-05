import { IsOptional, IsString } from 'class-validator';

export class LongShotLeagueWeeklyFilterDto {
    @IsString()
    @IsOptional()
    packId?: string;
}
