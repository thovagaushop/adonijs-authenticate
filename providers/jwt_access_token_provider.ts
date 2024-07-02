import { AccessTokensProviderContract } from '@adonisjs/auth/types/access_tokens'
import { LucidModel } from '@adonisjs/lucid/types/model'
import { JwtAccessTokenProviderOptions } from '../types/auth.js'
import { Algorithm } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'
import { RuntimeException } from '@adonisjs/core/exceptions'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import { DateTime } from 'luxon'
import { Secret } from '@adonisjs/core/helpers'
import lodash from 'lodash'

export class JwtAccessTokenProvider<TokenableModel extends LucidModel>
  implements AccessTokensProviderContract<TokenableModel>
{
  static forModel<TokenableModel extends LucidModel>(
    model: JwtAccessTokenProviderOptions<TokenableModel>['tokenableModel'],
    options: Omit<JwtAccessTokenProviderOptions<TokenableModel>, 'tokenableModel'>
  ) {
    return new JwtAccessTokenProvider<TokenableModel>({ tokenableModel: model, ...options })
  }

  protected algorithm: Algorithm

  constructor(protected options: JwtAccessTokenProviderOptions<TokenableModel>) {
    this.algorithm = options.algorithm || 'HS256'
  }

  #ensureIsPersisted(user: InstanceType<TokenableModel>) {
    const model = this.options.tokenableModel
    if (user instanceof model === false) {
      throw new RuntimeException(
        `Invalid user object. It must be an instance of the "${model.name}" model`
      )
    }

    if (!user.$primaryKeyValue) {
      throw new RuntimeException(
        `Cannot use "${model.name}" model for managing access tokens. The value of column "${model.primaryKey}" is undefined or null`
      )
    }
  }

  isObject(value: unknown) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
  }

  protected async getDb() {
    const model = this.options.tokenableModel
    return model.$adapter.query(model).client
  }

  async create(
    user: InstanceType<TokenableModel>,
    abilities?: string[],
    options?: {
      iat?: DateTime
      expiresIn?: number
    }
  ) {
    this.#ensureIsPersisted(user)

    const userId = user.$primaryKeyValue

    const expiresIn = options?.expiresIn || this.options.expiresInMilis

    const iat = options?.iat || DateTime.now()
    console.log(iat)

    const exp = iat.plus(expiresIn)

    const jwtToken = jwt.sign(
      {
        [this.options.primaryKey]: userId,
        iat: exp.toMillis(),
      },
      this.options.key,
      {
        algorithm: this.algorithm,
      }
    )

    return lodash.tap(
      new AccessToken({
        identifier: userId!,
        tokenableId: userId!,
        expiresAt: exp.toJSDate(),
        createdAt: DateTime.now().toJSDate(),
        updatedAt: DateTime.now().toJSDate(),
        lastUsedAt: DateTime.now().toJSDate(),
        abilities: abilities ?? [],
        type: 'jwt',
        name: 'jwt',
        hash: '',
      }),
      (accessToken) => (accessToken.value = new Secret(jwtToken))
    )
  }

  async verify(tokenValue: Secret<string>) {
    const jwtToken = tokenValue.release()
    try {
      const payload = jwt.verify(jwtToken, this.options.key, {
        algorithms: [this.algorithm],
      }) as Record<string, any>

      const userId = payload[this.options.primaryKey]

      console.log({ userId })

      if (!userId) {
        return null
      }

      return lodash.tap(
        new AccessToken({
          identifier: userId!,
          tokenableId: userId!,
          expiresAt: DateTime.now().plus(1000).toJSDate(),
          createdAt: DateTime.now().toJSDate(),
          updatedAt: DateTime.now().toJSDate(),
          lastUsedAt: DateTime.now().toJSDate(),
          abilities: [],
          type: 'jwt',
          name: 'jwt',
          hash: '',
        }),
        (accessToken) => (accessToken.value = new Secret(jwtToken))
      )
    } catch (error) {
      return null
    }
  }
}
