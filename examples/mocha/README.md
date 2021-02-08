## Overview
* In `.mocharc.yaml`:
  * Enable the [mocha-multi](https://www.npmjs.com/package/mocha-multi) reporter.
* In `.mocha-multi.json`:
  * Enable Kelonio's Mocha reporter.
  * Enable (default) or disable test description inference. When enabled, the
    current test name (including any nested `describe` calls) will be included
    in the performance report, in addition to any more specific descriptions
    that you pass to `benchmark.record()`.
* In `index.test.ts` or any other test file:
  * Call `benchmark.record()`.

## Output
Run `npm install` and `npm test` to try it out:

```
  A Mocha test
    ✓ can use Kelonio without a description
    ✓ can use Kelonio with a simple description
    1) can use Kelonio with a nested description


  2 passing (25ms)
  1 failing

  1) A Mocha test
       can use Kelonio with a nested description:
     Error: Minimum time of 0.003923 ms exceeded threshold of 0 ms
      at new PerformanceError (/Users/thomaschaplin/GIT/thomaschaplin/kelonio/src/index.ts:23:9)
      at verifyMeasurement (/Users/thomaschaplin/GIT/thomaschaplin/kelonio/src/index.ts:235:19)
      at Benchmark.<anonymous> (/Users/thomaschaplin/GIT/thomaschaplin/kelonio/src/index.ts:333:9)
      at step (/Users/thomaschaplin/GIT/thomaschaplin/kelonio/out/index.js:76:23)
      at Object.next (/Users/thomaschaplin/GIT/thomaschaplin/kelonio/out/index.js:57:53)
      at fulfilled (/Users/thomaschaplin/GIT/thomaschaplin/kelonio/out/index.js:48:58)




- - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
A Mocha test:
  can use Kelonio without a description:
    0.01078 ms (+/- 0.01239 ms) from 100 iterations
  can use Kelonio with a simple description:
    simple description:
      0.00455 ms (+/- 0.00094 ms) from 100 iterations
  can use Kelonio with a nested description:
    nested:
      description:
        0.00516 ms (+/- 0.00097 ms) from 100 iterations
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```
