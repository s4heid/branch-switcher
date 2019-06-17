# branch-switcher

> A GitHub App built with [Probot](https://github.com/probot/probot) which
> updates the base ref of a pull request that has been opened against a non-preferred
> branch.

## Setup

```sh
# Install dependencies
npm install

# Run typescript
npm run build

# Run the bot
npm start
```

## Configuration

Create a `.github/switch.yml` file in the root of the repository where
the branch-switcher has been installed. The following optional properties are supported:

 * `preferredBranch` *(string)* - name of the preferred branch against which the
   pull request should be opened. Default: develop.
 * `switchComment` *(string)* - content of the message indicating that the base
   has been updated to the preferred branch.

## Contributing

If you have suggestions for how branch-switcher could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 Sebastian Heid <sebastian.heid45@gmail.com>
