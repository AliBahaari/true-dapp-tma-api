import { IsString } from 'class-validator';

export class CreateLongShotTeamDto {
    @IsString()
    name: string;

    @IsString()
    logo: string;

    @IsString()
    leagueId: string;
}
