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
