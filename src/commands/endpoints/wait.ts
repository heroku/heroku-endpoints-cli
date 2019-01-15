import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand, {PrivateLinkDB} from '../../base'
import fetcher from '../../lib/fetcher'

export default class EndpointsWait extends BaseCommand {
  static description = 'wait for your Trusted VPC Endpoint to be provisioned'

  static args = [
    {name: 'database'}
  ]

  static flags = {
    app: flags.app({required: true})
  }

  static examples = [
    '$ heroku endpoints:wait',
  ]

  async run() {
    const {args, flags} = this.parse(EndpointsWait)
    const database = args.database || await fetcher(this.heroku, flags.app)

    let status
    cli.action.start('Waiting for the Trusted VPC Endpoint to be provisioned')
    while (status !== 'Operational') {
      let {body: res} = await this.heroku.get<PrivateLinkDB>(`/private-link/v0/databases/${database}`, this.heroku.defaults)
      status = res.status
      await cli.wait(3000)
    }
    cli.action.stop()
  }
}
