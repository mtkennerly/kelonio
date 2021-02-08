## Overview
* In `karma.conf.js`:
  * Enable Kelonio's Karma reporter.
  * Activate `karmaReporterSetup.js`.
  * Turn off browser logs going to the terminal. Kelonio uses `window.__karma__.log()`
    to transmit benchmark data from the browser to the main process, so otherwise
    you will see logging for all of the raw performance measurements.
  * Enable (default) or disable browser inference. When enabled, the current
    browser name will be included in the performance report.
* In `index.test.js` or any other test file:
  * Call `benchmark.record()`.

## Output
Run `npm install` and `npm test` to try it out:

```
  A Karma test
    ✓ can use Kelonio with a simple description
    ✗ can use Kelonio with a nested description
        Error: Minimum time of 0 ms exceeded threshold of -1 ms
        error properties: null({ constructor: Function })
            at new PerformanceError (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84884:28)
            at verifyMeasurement (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:85071:19)
            at Benchmark.<anonymous> (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:85140:25)
            at step (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84843:23)
            at Object.next (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84824:53)
            at fulfilled (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84815:58)

Chrome 88.0.4324 (Mac OS X 10.15.6) A Karma test can use Kelonio with a nested description FAILED
        Error: Minimum time of 0 ms exceeded threshold of -1 ms
        error properties: null({ constructor: Function })
            at new PerformanceError (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84884:28)
            at verifyMeasurement (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:85071:19)
            at Benchmark.<anonymous> (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:85140:25)
            at step (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84843:23)
            at Object.next (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84824:53)
            at fulfilled (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84815:58)

Chrome 88.0.4324 (Mac OS X 10.15.6): Executed 2 of 2 (1 FAILED) (0.014 secs / 0.008 secs)
TOTAL: 1 FAILED, 1 SUCCESS


1) can use Kelonio with a nested description
     A Karma test
     Error: Minimum time of 0 ms exceeded threshold of -1 ms
error properties: null({ constructor: Function })
    at new PerformanceError (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84884:28)
    at verifyMeasurement (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:85071:19)
    at Benchmark.<anonymous> (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:85140:25)
    at step (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84843:23)
    at Object.next (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84824:53)
    at fulfilled (/var/folders/63/jm0km8_n1m12nql44vwptcqm0000gn/T/552c5fa3af2352e1c126889f63a58ad9.browserify.js:84815:58)


- - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
Chrome 88.0.4324 (Mac OS X 10.15.6):
  simple description:
    0.00615 ms (+/- 0.00322 ms) from 100 iterations
  nested:
    description:
      0.0042 ms (+/- 0.0008 ms) from 100 iterations
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```
