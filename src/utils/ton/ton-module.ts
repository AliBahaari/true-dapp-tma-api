import { Global, Module } from "@nestjs/common";
import { TonService } from "./service/ton-service";

@Global()
@Module({providers:[TonService],exports:[TonService]})
export class TonModule{}