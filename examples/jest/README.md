## Overview
* In `package.json`:
  * Pass `--runInBand` to Jest to ensure accurate performance measurements.
* In `jest.config.js`:
  * Add `jest.setup.js` to `setupFilesAfterEnv`.
  * Enable Kelonio's Jest reporter.
* In `jest.setup.js`:
  * Enable benchmark serialization.
  * Call `JestReporter.initializeKelonio()` to ensure no serialized results
    from a prior test run are present. This is necessary because Jest does not
    expose an event for the start of the test run. If you omit this, the
    reporter will still delete the serialized data after the report is done,
    but if the tests are aborted midway, it may not have a chance to do that.
* In `index.test.ts` or any other test file:
  * Call `benchmark.record()`.

## Output
Run `npm install` and `npm test` to try it out:

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
