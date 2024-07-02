/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import User from '#models/user'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router
  .group(() => {
    router.post('', async (ctx) => {
      const user = await User.create({
        email: 'user@gmail.com',
        password: '12345678',
        fullName: 'spider man',
      })

      return ctx.response.ok(user)
    })

    router.post('/login', async (ctx) => {
      const user = await User.findByOrFail('email', 'user@gmail.com')

      const accessToken = await User.accessTokens.create(user)

      return ctx.response.ok(accessToken)
    })

    router
      .get('', async (ctx) => {
        const user = ctx.auth.user!
        console.log(user)
      })
      .use(middleware.auth({ guards: ['api'] }))
  })
  .prefix('/user')
