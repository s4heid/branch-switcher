import { Context } from 'probot'

interface ExcludeConfig {
  branch: string
  label: string
}

interface Config {
  preferredBranch: string
  exclude: Array<ExcludeConfig>
  switchComment: string
}

const defaultConfig: Config = {
  preferredBranch: 'develop',
  exclude: [],
  switchComment: 'Hello @{{author}}. The base branch of this pull request has been updated to the `{{preferredBranch}}` branch. Please revisit the changes and make sure that there are no conflicts with the new base branch. Thank you for your contributions.'
}
const configFilename: string = 'branch-switcher.yml'
const configPath: string = `.github/${configFilename}`

class ConfigNotFoundError extends Error {
  constructor (
    public readonly filePath: string
  ) {
    super(`Config file '${filePath}' not found`)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export async function loadConfig (context: Context) {
  const config = await context.config<Config>('branch-switcher.yml', defaultConfig)
  if (!config) {
    context.log.error('Failed to load configuration configuration')
    throw new ConfigNotFoundError(configPath)
  }
  context.log.debug(config, `Loaded config ${JSON.stringify(config)} from ${configPath}`)
  return config as Config
}
