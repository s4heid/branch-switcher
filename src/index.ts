import { update } from './update'

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

var serverless = require('@chadfawcett/probot-serverless-now')
export = process.env.NODE_ENV === 'production' ? serverless(cop) : cop
