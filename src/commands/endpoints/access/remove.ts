import Command, {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import host from '../../../lib/host'

const SHOGUN_URL = `https://${host()}/private-link/v0/databases`

export default class EndpointsAccessRemove extends Command {
  static description = 'remove an account from your Trusted VPC Endpoint\'s whitelist'

  static args = [
    {name: 'database', required: true},
    {name: 'account_ids', required: true}
  ]

  static flags = {
    app: flags.app({required: true})
  }

  static examples = [
    '$ heroku endpoints:access:remove arn:aws:iam::12345678910:root',
  ]

  async run() {
    const {args} = this.parse(EndpointsAccessRemove)

    const defaultOptions = {
      headers: {
        authorization: `Basic ${Buffer.from(':' + this.heroku.auth).toString('base64')}`
      }
    }

    cli.action.start('Removing account from the whitelist')
    await this.heroku.patch<any>(`${SHOGUN_URL}/${args.database}/whitelisted_accounts`, {
      ...defaultOptions,
      body: {
        whitelisted_accounts: [args.account_ids]
      }
    })
    cli.action.stop()
  }
}
