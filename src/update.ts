import { loadConfig } from './config'

export async function update (context: import('probot').Context) {
  const cfg = await loadConfig(context)
  const preferredBranch = cfg.preferredBranch
  const messageText = cfg.switchComment
  const exclude = cfg.exclude
  const actualBranch = context.payload.pull_request.base.ref
  const actualLabels = context.payload.pull_request.labels.map((c: { name: string }) => c.name)

  const excludeBranches = (exclude || []).filter(c => c.branch).map(c => c.branch)
  const excludeLabels = (exclude || []).filter(c => c.label).map(c => c.label)

  if (actualBranch === preferredBranch) {
    context.log(`skipping (branch ${actualBranch} is already preferred)`)
    return
  }

  if (excludeBranches.some((rule) => new RegExp(`^${rule.split('*').join('.*')}$`).test(actualBranch))) {
    context.log(`skipping (branch ${actualBranch} is excluded)`)
    return
  }

  const excludedLabels = actualLabels.filter((value: string) => excludeLabels.includes(value))
  if (excludedLabels.length > 0) {
    context.log(`skipping (labels ${excludedLabels} are excluded)`)
    return
  }

  context.log(`changing branch (to ${preferredBranch}; from ${actualBranch})`)
  const updateBranch = context.repo({
    pull_number: context.payload.pull_request.number,
    base: preferredBranch
  })
  await context.octokit.pulls.update(updateBranch)

  const interpolatedMsg = messageText.replace(
    /{{(?:author)}}/,
    context.payload.pull_request.user.login
  ).replace(
    /{{(?:preferredBranch)}}/,
    preferredBranch
  )
  context.log(`adding comment (${interpolatedMsg})`)

  const pullComment = context.repo({
    issue_number: context.payload.pull_request.number,
    body: interpolatedMsg
  })

  try {
    await context.octokit.issues.createComment(pullComment)
  } catch (err) {
    err.message = `There was an issue commenting on PR #${pullComment.issue_number} \n\n${err.message}`
    context.log.error(err)
  }
}
