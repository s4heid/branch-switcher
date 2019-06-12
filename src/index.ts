import { Application } from 'probot'
import { update } from './update'


const cop = (app: Application) => {
  app.log('Branch Switcher is listening...')
  app.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.edited'], update)
}

export = cop
