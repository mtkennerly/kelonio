## Development
* Prepare environment:
  * `npm install`
* Build:
  * `npm run build`
* Run tests:
  * `npm test`
* Run linting:
  * `npm run lint`
* Activate pre-commit hooks (requires Python; some systems may use `pip3` instead of `pip`):
  ```
  pip install --user pre-commit
  pre-commit install
  ```

After making a change in `src`,
you'll need to build in order for the change to propagate to the projects in `examples`.

## Release
* Update the version and date in `CHANGELOG.md`
* Update the version in `package.json`
* Run `npm i` to update the lock file
* Run `git commit -m "Release v0.0.0" && git tag v0.0.0 -m "Release"`
* Run `npm publish`
* Create a release on GitHub for the new tag and attach the artifact from `npm pack`
* Run `npm run deploy` to update the documentation
