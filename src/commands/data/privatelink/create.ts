import color from '@heroku-cli/color'
import {flags} from '@heroku-cli/command'
import {AddOn} from '@heroku-cli/schema'
import {cli} from 'cli-ux'

import BaseCommand, {PrivateLinkDB} from '../../../base'
import fetcher from '../../../lib/fetcher'

export default class EndpointsCreate extends BaseCommand {
  static description = 'create a new privatelink endpoint for your database'
  static aliases = ['pg:privatelink:create', 'kafka:privatelink:create', 'redis:privatelink:create']

  static args = [
    {name: 'database'},
  ]

  static flags = {
    'aws-account-id': flags.build({
      char: 'i',
      description: 'AWS account id to use',
      parse: (input: string, ctx: any) => {
        if (!ctx.endpoints_create_ids) ctx.endpoints_create_ids = []
        ctx.endpoints_create_ids.push(input)
        return ctx.endpoints_create_ids
      },
    })(),
    app: flags.app({required: true})
  }

  static examples = [
    '$ heroku data:privatelink:create postgresql-sushi-12345 --aws-account-id 123456789012:user/abc',
    '$ heroku data:privatelink:create postgresql-sushi-12345 --aws-account-id 123456789012:user/abc --account-id 123456789012:user/xyz',
  ]

  async checkShielded(database: string, app: string) {
    const {body: addon} = await this.heroku.get<AddOn>(`/apps/${app}/addons/${database}`)
    const planName = addon && addon.plan ? addon.plan.name : null
    if (planName && planName.includes('shield')) {
      return true
    } else {
      return false
    }
  }

  async run() {
    const {args, flags} = this.parse(EndpointsCreate)
    const database = await fetcher(this.heroku, args.database, flags.app)
    const isShielded = await this.checkShielded(database, flags.app)
    const account_ids = flags['aws-account-id']

    if (isShielded) {
      const confirm = await cli.prompt('This feature allows access from outside of your Shield Private Space and may reduce your security. Do you agree to these risks? Type \'I agree\'')
      if (confirm === 'I agree') {
        cli.log('Thank you. These actions will be logged.')
      } else {
        cli.log('This feature was not enabled')
        cli.exit()
      }
    }

    cli.action.start('Creating privatelink endpoint')
    const {body: res} = await this.shogun.post<PrivateLinkDB>(`/private-link/v0/databases/${database}`, {
      ...this.shogun.defaults,
      body: {
        whitelisted_accounts: account_ids
      }
    })
    cli.action.stop()
    this.log()
    cli.styledObject({
      Status: res.status,
      'Service Name': res.service_name || 'Provisioning'
    })

    this.log()
    this.log(`The privatelink endpoint is now being provisioned for ${color.cyan(database)}.`)
    this.log(`Run ${color.cyan('heroku data:privatelink:wait --app APP')} to check the creation process.`)
  }
}
