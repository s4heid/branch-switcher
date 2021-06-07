import nock from 'nock'

export const endpoint = 'https://api.github.com'

export function nockEmptyConfig () {
  nock(endpoint)
    .persist()
    .get('/repos/s4heid/branch-switcher/contents/.github%2Fbranch-switcher.yml')
    .reply(404)
    .get('/repos/s4heid/.github/contents/.github%2Fbranch-switcher.yml')
    .reply(404)
    .get('/repos/s4heid/branch-switcher/contents/.github%2Fbranch-switcher.yaml')
    .reply(404)
    .get('/repos/s4heid/.github/contents/.github%2Fbranch-switcher.yml')
    .reply(404)
}

export function nockUserConfig (config: string) {
  nock('https://api.github.com')
    .get('/repos/s4heid/branch-switcher/contents/.github%2Fbranch-switcher.yml')
    .reply(404)
    .get('/repos/s4heid/.github/contents/.github%2Fbranch-switcher.yml')
    .reply(200, config)
}
