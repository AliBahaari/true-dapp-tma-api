import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ExceptionMessageEnum } from "src/common/enum/exception-messages.enum";
import { IUserToken } from "src/common/interfaces/user-token.interface";
import { UserRoles } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateTreasuryDto } from "../dto/create-treasury.dto";
import { TreasuryEntity } from "../entities/treasury.entity";

@Injectable()
export class TreasuryService{
    constructor(@InjectRepository(TreasuryEntity)
    private readonly trreasuryRepo: Repository<TreasuryEntity>){}

    public async createTreasuryAddress(createTreasuryDto:CreateTreasuryDto,user:IUserToken):Promise<TreasuryEntity>
    {
        if(!user.roles.includes(UserRoles.OWNER))
        throw new BadRequestException(ExceptionMessageEnum.ONLY_OWNER_CAN_CREATE_TREASURY)
        
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