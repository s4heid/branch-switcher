import { Application } from 'probot'
import { update } from './update'

const cop = (app: Application) => {
  app.log.info('Branch Switcher is listening...')
  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.edited',
    'pull_request.labeled',
    'pull_request.unlabeled'
  ], update)
}

export = cop
