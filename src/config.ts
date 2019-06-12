import {Context} from 'probot'

export interface Config {
    preferredBranch: string
    // responseRequired: boolean
    response: string
}

const defaultConfig: Config = {
    preferredBranch: 'develop',
    // responseRequired: true,
    response: 'The base branch of this pull request has been automatically updated to the `develop` branch. Thank you for your contributions.'
}

export async function getConfig(context: Context) {
    const config = await context.config('switch.yml', defaultConfig);
    return config as Config
}
