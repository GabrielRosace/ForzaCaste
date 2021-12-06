export interface User{
  username: string,
  name: string,
  surname: string,
  avatarImgURL: string,
  mail: string,
  role: string,
  friendList: any[],
  statistics: any[]
}

export function isUser(u:any): u is User {
  return true //TODO
}