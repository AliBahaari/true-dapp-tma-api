import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateTreasuryDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    address:string
}