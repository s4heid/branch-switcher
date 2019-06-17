import {Context} from 'probot'
import {getConfig} from './config'

export async function update(context: Context) {
  const cfg = await getConfig(context)
  const preferredBranch = cfg.preferredBranch
  const messageText = cfg.switchComment

  const actualBranch = context.payload.pull_request.base.ref

  if (actualBranch == preferredBranch) {
    context.log('skipping (branch ${actualBranch} is already preferred)')
    return
  }

  const updateBranch = context.repo({
    number: context.payload.pull_request.number,
    base: preferredBranch
  })
  await context.github.pullRequests.update(updateBranch)

  context.log(`adding comment (${messageText})`)
  const pullComment = context.repo({
    number: context.payload.pull_request.number,
    body: messageText
  })
  await context.github.issues.createComment(pullComment)
}
