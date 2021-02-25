## Overview
* In `package.json`:
  * Pass `--runInBand` to Jest to ensure accurate performance measurements.
* In `jest.config.js`:
  * Add Kelonio's `jestReporterSetup.js` to `setupFilesAfterEnv`, which will:
    * Enable benchmark serialization, because otherwise the reporter does not
      have access to performance data from the test run. The data will be in
      `.kelonio.state.json`, which will be deleted at the end of the tests.
    * Ensure no serialized results from a prior test run are present.
  * Enable Kelonio's Jest reporter. Available configuration:
    * `keepStateAtEnd` (boolean): Whether to retain the state file at the end of the test run,
      instead of deleting it like normal. Default: false.
    * `printReportAtEnd` (boolean): Print the performance report at the end of the test run.
      Default: true.
* In `index.test.ts` or any other test file:
  * Call `benchmark.record()`.

## Output
Run `npm install` and `npm test` to try it out:

```
FAIL ./index.test.ts (5.398s)
  A Jest test
    √ can use Kelonio with a simple description (4ms)
    × can use Kelonio with a nested description (20ms)

  ● A Jest test › can use Kelonio with a nested description

    Minimum time of 0.002821 ms exceeded threshold of 0 ms

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
Snapshots:   0 total
Time:        6.797s
Ran all test suites.

- - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
simple description:
  0.00577 ms (+/- 0.0043 ms) from 100 iterations
nested:
  description:
    0.00392 ms (+/- 0.00068 ms) from 100 iterations
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

## Environment Variables

Default options consist of the following:

| Name                        | Default Option |
| :-------------------------- | :------------- |
| KELONIO_KEEP_STATE_AT_START | FALSE          |

The available options consist of the following:

| Name                        | Option | Description                                                                                |
| :-------------------------- | :----- | :----------------------------------------------------------------------------------------- |
| KELONIO_KEEP_STATE_AT_START | FALSE  | Generates a fresh ".kelonio.state.json" each time jest is executed                         |
| KELONIO_KEEP_STATE_AT_START | TRUE   | Appends to the existing state file ".kelonio.state.json" instead of generating a fresh one |
