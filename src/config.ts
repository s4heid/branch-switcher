import {Context} from 'probot'

export interface Config {
	preferredBranch: string
	exclude: Array<string>
	switchComment: string
}

const defaultConfig: Config = {
	preferredBranch: 'develop',
	exclude: [],
	switchComment: 'The base branch of this pull request has been automatically updated to the `develop` branch. Thank you for your contributions.'
}

export async function getConfig(context: Context) {
	const config = await context.config('switch.yml', defaultConfig)
	context.log.debug(config, 'Loaded config from .github/switch.yml')
	return config as Config
}
