import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { JwtAccessTokenProvider } from '#providers/jwt_access_token_provider'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = JwtAccessTokenProvider.forModel(User, {
    expiresInMilis: 100000,
    key: 'secret',
    primaryKey: 'id',
  })
}
