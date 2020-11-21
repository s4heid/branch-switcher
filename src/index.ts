import { Application } from 'probot' // eslint-disable-line no-unused-vars
import { update } from './update'

export = (app: Application) => {
  app.log.info('Branch Switcher is listening for events...')
  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.edited',
    'pull_request.labeled',
    'pull_request.unlabeled'
  ], update)
}
