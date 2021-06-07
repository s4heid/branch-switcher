import nock from 'nock'
import { Probot, ProbotOctokit } from 'probot'
import branchSwitcher from '../src'
import * as helper from './test-helper'
import defaultPayload from './fixtures/pullrequests.opened.json'
import contentFile from './fixtures/content_file.json'

const defaultComment = { body: 'Hello @dpb587. The base branch of this pull request has been updated to the `develop` branch. Please revisit the changes and make sure that there are no conflicts with the new base branch. Thank you for your contributions.' }

describe('Branch switcher', () => {
  let probot: any
  let payload: any

  beforeEach(() => {
    nock.disableNetConnect()
    probot = new Probot({
      appId: 123,
      githubToken: 'test-token',
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false }
      })
    })
    probot.load(branchSwitcher)
  })

  describe('opened against non-preferred branch', () => {
    beforeEach(() => {
      payload = defaultPayload
      payload.pull_request.base = { ref: 'master' }
    })

    it('can comment on open pull requests', async (done) => {
      nock(helper.endpoint)
        .patch('/repos/s4heid/branch-switcher/pulls/1')
        .reply(200)
        .post('/repos/s4heid/branch-switcher/issues/1/comments', (body: any) => {
          done(expect(body).toMatchObject(defaultComment))
          return true
        })
        .reply(200)

      helper.nockEmptyConfig()

      await probot.receive({ name: 'pull_request', payload })
    })

    it('can switch the base to the preferred branch', async (done) => {
      helper.nockEmptyConfig()

      nock(helper.endpoint)
        .patch('/repos/s4heid/branch-switcher/pulls/1', (body: any) => {
          expect(body).toMatchObject({ base: 'develop' })
          return true
        })
        .reply(200)

      nock(helper.endpoint)
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

      it('can customize message of the comment', async (done) => {
        helper.nockUserConfig('switchComment: something')

        nock(helper.endpoint)
          .patch('/repos/s4heid/branch-switcher/pulls/1', (body: any) => {
            expect(body).toMatchObject({ base: 'develop' })
            return true
          })
          .reply(200)

          .post('/repos/s4heid/branch-switcher/issues/1/comments', (body: any) => {
            done(expect(body.body).toEqual(expect.stringContaining('something')))
            return true
          })
          .reply(200)

        await probot.receive({ name: 'pull_request', payload })
      })

      it('can interpolate variables from custom config into the comment', async (done) => {
        payload.pull_request.user.login = 'johndoe'

        helper.nockUserConfig(`preferredBranch: my-branch
switchComment: "@{{author}}, base branch is now {{preferredBranch}}"
`)

        nock(helper.endpoint)
          .patch('/repos/s4heid/branch-switcher/pulls/1', (body: any) => {
            expect(body).toMatchObject({ base: 'my-branch' })
            return true
          })
          .reply(200)

          .post('/repos/s4heid/branch-switcher/issues/1/comments', (body: any) => {
            done(expect(body.body).toEqual(expect.stringContaining('@johndoe, base branch is now my-branch')))
            return true
          })
          .reply(200)

        await probot.receive({ name: 'pull_request', payload })
      })

      it('respects exclude properties', async () => {
        payload.pull_request.base = { ref: 'dont-switch' }

        helper.nockUserConfig('exclude: [branch: dont-*, branch: really-dont-switch]')

        await probot.receive({ name: 'pull_request', payload })
      })

      it('respects exclude label properties', async () => {
        payload.pull_request.labels = [{ name: 'ignore' }]

        helper.nockUserConfig('exclude: [label: ignore]')

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
      helper.nockEmptyConfig()

      await probot.receive({ name: 'pull_request', payload })
    })
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
