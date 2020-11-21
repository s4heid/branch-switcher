import nock from 'nock'
import branchSwitcher from '../src'
import { Probot } from 'probot'
import defaultPayload from './fixtures/pullrequests.opened.json'
import contentFile from './fixtures/content_file.json'

const defaultComment = { body: 'Hello @potatoe. The base branch of this pull request has been updated to the `develop` branch. Please revisit the changes and make sure that there are no conflicts with the new base branch. Thank you for your contributions.' }

describe('Branch switcher', () => {
  let probot: any
  let payload: any

  beforeEach(() => {
    nock.disableNetConnect()
    probot = new Probot({
      id: 123,
      githubToken: 'test'
    })
    const app = probot.load(branchSwitcher)

    app.app = {
      getInstallationAccessToken: () => Promise.resolve('test')
    }
    nock.cleanAll()
  })

  describe('opened against non-preferred branch', () => {
    beforeEach(() => {
      payload = defaultPayload
      payload.pull_request.base = { ref: 'master' }
    })

    it('can comment on open pull requests', async (done) => {
      nock('https://api.github.com')
        .patch('/repos/s4heid/branch-switcher/pulls/1')
        .reply(200)
        .post('/repos/s4heid/branch-switcher/issues/1/comments', (body: any) => {
          done(expect(body).toMatchObject(defaultComment))
          return true
        })
        .reply(200)

      nock('https://api.github.com')
        .get('/repos/s4heid/branch-switcher/contents/.github/branch-switcher.yml')
        .reply(404)
        .get('/repos/s4heid/.github/contents/.github/branch-switcher.yml')
        .reply(404)

      await probot.receive({ name: 'pull_request', payload })
    })

    it('can switch the base to the preferred branch', async (done) => {
      nock('https://api.github.com')
        .get('/repos/s4heid/branch-switcher/contents/.github/branch-switcher.yml')
        .reply(404)
        .get('/repos/s4heid/.github/contents/.github/branch-switcher.yml')
        .reply(404)

      nock('https://api.github.com')
        .patch('/repos/s4heid/branch-switcher/pulls/1', (body: any) => {
          expect(body).toMatchObject({ base: 'develop' })
          return true
        })
        .reply(200)

      nock('https://api.github.com')
        .post('/repos/s4heid/branch-switcher/issues/1/comments', (body: any) => {
          done(expect(body.body).toEqual(expect.stringContaining('The base')))
          return true
        })
        .reply(200)

      await probot.receive({ name: 'pull_request', payload })
    })

    describe('when custom config exists', () => {
      beforeEach(() => {
        contentFile.name = 'branch-switcher.yml'
        contentFile.path = '.github/branch-switcher.yml'
      })

      it('can customize switchComment message', async (done) => {
        const configData = 'switchComment: something'
        contentFile.content = Buffer.from(configData).toString('base64')

        nock('https://api.github.com')
          .get('/repos/s4heid/branch-switcher/contents/.github/branch-switcher.yml')
          .reply(200, contentFile)

        nock('https://api.github.com')
          .patch('/repos/s4heid/branch-switcher/pulls/1', (body: any) => {
            expect(body).toMatchObject({ base: 'develop' })
            return true
          })
          .reply(200)

        nock('https://api.github.com')
          .post('/repos/s4heid/branch-switcher/issues/1/comments', (body: any) => {
            done(expect(body.body).toEqual(expect.stringContaining('something')))
            return true
          })
          .reply(200)

        await probot.receive({ name: 'pull_request', payload })
      })

      it('interpolates variables from custom config into switchComment', async (done) => {
        payload.pull_request.user.login = 'johndoe'

        const configData = `preferredBranch: my-branch
switchComment: "@{{author}}, base branch is now {{preferredBranch}}"
`
        contentFile.content = Buffer.from(configData).toString('base64')

        nock('https://api.github.com')
          .get('/repos/s4heid/branch-switcher/contents/.github/branch-switcher.yml')
          .reply(200, contentFile)

        nock('https://api.github.com')
          .patch('/repos/s4heid/branch-switcher/pulls/1', (body: any) => {
            expect(body).toMatchObject({ base: 'my-branch' })
            return true
          })
          .reply(200)

        nock('https://api.github.com')
          .post('/repos/s4heid/branch-switcher/issues/1/comments', (body: any) => {
            done(expect(body.body).toEqual(expect.stringContaining('@johndoe, base branch is now my-branch')))
            return true
          })
          .reply(200)

        await probot.receive({ name: 'pull_request', payload })
      })

      it('respects exclude properties', async () => {
        payload.pull_request.base = { ref: 'dont-switch' }

        const configData = 'exclude: [branch: dont-*, branch: really-dont-switch]'
        contentFile.content = Buffer.from(configData).toString('base64')

        nock('https://api.github.com')
          .get('/repos/s4heid/branch-switcher/contents/.github/branch-switcher.yml')
          .reply(200, contentFile)

        await probot.receive({ name: 'pull_request', payload })
      })

      it('respects exclude label properties', async () => {
        payload.pull_request.labels = [{ name: 'ignore' }]

        const configData = 'exclude: [label: ignore]'
        contentFile.content = Buffer.from(configData).toString('base64')

        nock('https://api.github.com')
          .get('/repos/s4heid/branch-switcher/contents/.github/branch-switcher.yml')
          .reply(200, contentFile)

        await probot.receive({ name: 'pull_request', payload })
      })
    })
  })

  describe('opened against the preferred branch', () => {
    beforeEach(() => {
      payload = defaultPayload
      payload.pull_request.base = { ref: 'develop' }
    })

    it('does not comment', async () => {
      nock('https://api.github.com')
        .get('/repos/s4heid/branch-switcher/contents/.github/branch-switcher.yml')
        .reply(404)
        .get('/repos/s4heid/.github/contents/.github/branch-switcher.yml')
        .reply(404)

      await probot.receive({ name: 'pull_request', payload })
    })
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
