import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, isString } from "class-validator"

export class AddMarketerDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    initData:string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    referralCode:string
}