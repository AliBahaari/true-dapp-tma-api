import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
    @IsString()
    @IsNotEmpty()
    initData: string;
}
