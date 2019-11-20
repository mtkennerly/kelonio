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
    √ can use Kelonio without a description
    √ can use Kelonio with a simple description
    1) can use Kelonio with a nested description


  2 passing (22ms)
  1 failing

  1) A Mocha test
       can use Kelonio with a nested description:
     Error: Minimum time of 0.00282 ms exceeded threshold of 0 ms


- - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
A Mocha test:
  can use Kelonio without a description:
    0.00915 ms (+/- 0.01169 ms) from 100 iterations
  can use Kelonio with a simple description:
    simple description:
      0.00388 ms (+/- 0.00136 ms) from 100 iterations
  can use Kelonio with a nested description:
    nested:
      description:
        0.0037 ms (+/- 0.00071 ms) from 100 iterations
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```
