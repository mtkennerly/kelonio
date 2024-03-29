## Overview
* In `.mocharc.yaml`:
  * Enable the [mocha-multi-reporters](https://www.npmjs.com/package/mocha-multi-reporters) reporter.
* In `.mocha-multi.json`:
  * Enable Kelonio's Mocha reporter.
  * Enable (default) or disable test description inference. When enabled, the
    current test name (including any nested `describe` calls) will be included
    in the performance report, in addition to any more specific descriptions
    that you pass to `benchmark.record()`.
  * Enable (default) or disable printing the performance report at the end of the test run.
  * Optionally configure some `extensions`.

    Each item must be an object with the properties `module` (passed to `require()`)
    and `extension` (name of an object from the module). The named extension object
    may have these methods:

    * `extraReport: (benchmark: Benchmark) => string | void` - This will be called after
      the main report and printed if it returns something.
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

= = Custom Report = =
Fastest: "A Mocha test/can use Kelonio with a nested description/nested/description" (0.0037 ms)
= = = = = = = = = = =
```
