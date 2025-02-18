import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsNotEmpty, IsNumber } from "class-validator"

export class UpdateMarketerDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsBoolean()
    vip:boolean

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    commission:number
}