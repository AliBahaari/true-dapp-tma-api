import { UserRoles } from "../entities/user.entity"

export interface AccessToken{
    id:string
    roles:UserRoles[]
}