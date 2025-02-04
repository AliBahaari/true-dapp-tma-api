import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TreasuryController } from "./controllers/treasury.controller";
import { TreasuryEntity } from "./entities/treasury.entity";
import { TreasuryService } from "./services/treasury.service";

@Module({
    imports:[TypeOrmModule.forFeature([TreasuryEntity])],
    controllers:[TreasuryController],
    providers:[TreasuryService],
    exports:[TreasuryService]
})
export class  TreasuryModule{}