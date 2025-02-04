import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateTreasuryDto } from "../dto/create-treasury.dto";
import { TreasuryEntity } from "../entities/treasury.entity";

@Injectable()
export class TreasuryService{
    constructor(@InjectRepository(TreasuryEntity)
    private readonly trreasuryRepo: Repository<TreasuryEntity>){}

    public async createTreasuryAddress(createTreasuryDto:CreateTreasuryDto):Promise<TreasuryEntity>
    {
        const instance= this.trreasuryRepo.create({address:createTreasuryDto.address})
        return await this.trreasuryRepo.save(instance)
    }

    public async findLastestTreasury():Promise<TreasuryEntity>
    {
        const treasuryAddress= await this.trreasuryRepo.find({
            order:{createdAt:"desc"},
            take:1
        })

        return treasuryAddress[0]
    }
}