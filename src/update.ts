import {Context} from 'probot'
import {getConfig} from './config'

export async function update(context: Context) {
  const cfg = await getConfig(context)
  const preferredBranch = cfg.preferredBranch
  const messageText = cfg.switchComment
  const exclude = cfg.exclude

  const actualBranch = context.payload.pull_request.base.ref

  if (actualBranch == preferredBranch) {
    context.log('skipping (branch ${actualBranch} is already preferred)')
    return
  }

  if (exclude.some((rule) => new RegExp(`^${rule.split('*').join('.*')}$`).test(actualBranch))) {
    context.log(`skipping (branch ${actualBranch} is excluded)`)
    return
  }

  context.log(`changing branch (to ${preferredBranch}; from ${actualBranch})`)
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
