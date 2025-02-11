import { IsString } from 'class-validator';

export class UpdateLongShotTeamDto {
    @IsString()
    name: string;

    @IsString()
    logo: string;

    @IsString()
    leagueId: string;
}
