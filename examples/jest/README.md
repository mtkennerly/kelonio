## Overview
* In `package.json`:
  * Pass `--runInBand` to Jest to ensure accurate performance measurements.
* In `jest.config.js`:
  * Add Kelonio's `jestReporterSetup.js` to `setupFilesAfterEnv`, which will:
    * Enable benchmark serialization, because otherwise the reporter does not
      have access to performance data from the test run. The data will be in
      `.kelonio.state.json`, which will be deleted at the end of the tests.
    * Ensure no serialized results from a prior test run are present.
  * Enable Kelonio's Jest reporter.
* In `index.test.ts` or any other test file:
  * Call `benchmark.record()`.

## Output
Run `npm install` and `npm test` to try it out:

```
 FAIL  ./index.test.ts
  A Jest test
    ✓ can use Kelonio with a simple description (4ms)
    ✕ can use Kelonio with a nested description (12ms)

  ● A Jest test › can use Kelonio with a nested description

    Minimum time of 0.004708 ms exceeded threshold of 0 ms

      21 | export class PerformanceError extends Error {
      22 |     constructor(message?: string) {
    > 23 |         super(message);
         |         ^
      24 |         Object.setPrototypeOf(this, new.target.prototype);
      25 |     }
      26 | }

      at new PerformanceError (../../src/index.ts:23:9)
      at verifyMeasurement (../../src/index.ts:235:19)
      at Benchmark.<anonymous> (../../src/index.ts:333:9)
      at step (../../out/index.js:76:23)
      at Object.next (../../out/index.js:57:53)
      at fulfilled (../../out/index.js:48:58)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
Snapshots:   0 total
Time:        2.621s

- - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
simple description:
  0.00771 ms (+/- 0.00437 ms) from 100 iterations
nested:
  description:
    0.00555 ms (+/- 0.00088 ms) from 100 iterations
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```
