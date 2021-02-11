## Overview
* In `karma.conf.js`:
  * Enable Kelonio's Karma reporter.
  * Activate `karmaReporterSetup.js`.
  * Turn off browser logs going to the terminal. Kelonio uses `window.__karma__.log()`
    to transmit benchmark data from the browser to the main process, so otherwise
    you will see logging for all of the raw performance measurements.
  * Enable (default) or disable browser inference. When enabled, the current
    browser name will be included in the performance report.
  * Enable (default) or disable printing the performance report at the end of the test run.
* In `index.test.js` or any other test file:
  * Call `benchmark.record()`.

## Output
Run `npm install` and `npm test` to try it out:

```
  A Karma test
    √ can use Kelonio with a simple description
    × can use Kelonio with a nested description
        Error: Minimum time of 0.004999 ms exceeded threshold of -1 ms


Chrome 78.0.3904 (Windows 10.0.0): Executed 2 of 2 (1 FAILED) (0.116 secs / 0.016 secs)
TOTAL: 1 FAILED, 1 SUCCESS


- - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
Chrome 78.0.3904 (Windows 10.0.0):
  simple description:
    0.01015 ms (+/- 0.00294 ms) from 100 iterations
  nested:
    description:
      0.00935 ms (+/- 0.00149 ms) from 100 iterations
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```
