interface Config {
  preferredBranch: string
  exclude: Array<ExcludeConfig>
  switchComment: string
}

interface ExcludeConfig {
  branch: string
  label: string
}

const defaultConfig: Config = {
  preferredBranch: 'develop',
  exclude: [],
  switchComment: 'Hello @{{author}}. The base branch of this pull request has been updated to the `{{preferredBranch}}` branch. Please revisit the changes and make sure that there are no conflicts with the new base branch. Thank you for your contributions.'
}

export async function getConfig (context: import('probot').Context) {
  const config = await context.config('switch.yml', defaultConfig)
  context.log.debug(config, 'Loaded config from .github/switch.yml')
  return config as Config
}
