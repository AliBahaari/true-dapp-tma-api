import { UserRoles } from "src/users/entities/user.entity"

export interface IUserToken{
    id:string
    roles:UserRoles[]
    initData:string
    secretCode:string
}