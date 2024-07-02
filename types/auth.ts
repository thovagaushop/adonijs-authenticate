import { LucidModel } from '@adonisjs/lucid/types/model'
import { Algorithm, Secret } from 'jsonwebtoken'

export type JwtAccessTokenProviderOptions<TokenableModel extends LucidModel> = {
  tokenableModel: TokenableModel
  expiresInMilis: number
  key: Secret
  algorithm?: Algorithm
  primaryKey: string
}
