import { update } from './update'
import { serverless } from '@chadfawcett/probot-serverless-now'

const cop = (app: import('probot').Application) => {
  app.log.info('Branch Switcher is listening for events...')
  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.edited',
    'pull_request.labeled',
    'pull_request.unlabeled'
  ], update)
}

export = process.env.IS_NOW ? serverless(cop) : cop
