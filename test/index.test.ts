import nock from 'nock'
import branchSwitcher from '../src'
import {Probot} from 'probot'
import defaultPayload from './fixtures/pullrequests.opened.json'
import contentFile from './fixtures/content_file.json'

const prCreatedBody = {body: 'The base branch of this pull request has been automatically updated to the `develop` branch. Thank you for your contributions.'}

nock.disableNetConnect()

describe('Branch switcher', () => {
	let probot: any
	let payload: any

	beforeEach(() => {
		probot = new Probot({id: 123, cert: 'test'})
		const app = probot.load(branchSwitcher)
		app.app = () => 'test'
	})

	describe('opened against non-preferred branch', () => {
		beforeEach(() => {
			payload = defaultPayload
			payload.pull_request.base = {'ref': 'master'}
		})

		test('can comment on openend pull requests', async (done) => {
			nock('https://api.github.com')
				.patch('/repos/beans/testing-things/pulls/1')
				.reply(200)
				.post('/repos/beans/testing-things/issues/1/comments', (body: any) => {
					done(expect(body).toMatchObject(prCreatedBody))
					return true
				})
				.reply(200)

			nock('https://api.github.com')
				.get('/repos/beans/testing-things/contents/.github/switch.yml')
				.reply(404)

			await probot.receive({name: 'pull_request', payload})
		})

		test('can switch the base to the preferred branch', async (done) => {
			nock('https://api.github.com')
				.get('/repos/beans/testing-things/contents/.github/switch.yml')
				.reply(404)

			nock('https://api.github.com')
				.patch('/repos/beans/testing-things/pulls/1', (body: any) => {
					expect(body).toMatchObject({base: 'develop'})
					return true
				})
				.reply(200)

			nock('https://api.github.com')
				.post('/repos/beans/testing-things/issues/1/comments', (body: any) => {
					done(expect(body.body).toEqual(expect.stringContaining('The base')))
					return true
				})
				.reply(200)

			await probot.receive({name: 'pull_request', payload})
		})

		describe('when custom config exists', () => {
			beforeEach(() => {
				contentFile.name = 'switch.yml'
				contentFile.path = '.github/switch.yml'
			})

			test('can customize switchComment message', async (done) => {
				const configData = 'switchComment: something'
				contentFile.content = Buffer.from(configData).toString('base64')

				nock('https://api.github.com')
					.get('/repos/beans/testing-things/contents/.github/switch.yml')
					.reply(200, contentFile)

				nock('https://api.github.com')
					.patch('/repos/beans/testing-things/pulls/1', (body: any) => {
						expect(body).toMatchObject({base: 'develop'})
						return true
					})
					.reply(200)

				nock('https://api.github.com')
					.post('/repos/beans/testing-things/issues/1/comments', (body: any) => {
						done(expect(body.body).toEqual(expect.stringContaining('something')))
						return true
					})
					.reply(200)

				await probot.receive({name: 'pull_request', payload})
			})
		})
	})

	describe('opened against the preferred branch', () => {
		beforeEach(() => {
			payload = defaultPayload
			payload.pull_request.base = {'ref': 'develop'}
		})

		test('does not comment', async () => {
			nock('https://api.github.com')
				.get('/repos/beans/testing-things/contents/.github/switch.yml')
				.reply(404)

			await probot.receive({name: 'pull_request', payload})
		})
	})
})
