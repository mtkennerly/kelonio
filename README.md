# Kelonio
[![Build Status](https://travis-ci.org/mtkennerly/kelonio.svg?branch=master)](https://travis-ci.org/mtkennerly/kelonio)
[![Version](https://img.shields.io/npm/v/kelonio)](https://www.npmjs.com/package/kelonio)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Kelonio is a performance testing library for Node.js, written in TypeScript.
Whereas many similar projects are test frameworks in and of themselves, Kelonio
is fundamentally a **library** and therefore aims to integrate with existing
test frameworks seamlessly instead of reinventing the wheel. You can use it
inside of your existing tests from frameworks such as Jest and Mocha (along
with any loaders like [ts-jest](https://www.npmjs.com/package/ts-jest)),
and you can use it in the console and scripts as well.

Kelonio also works in the browser (as long as you use a tool like
[Webpack](https://www.npmjs.com/package/webpack) or
[Browserify](https://www.npmjs.com/package/browserify)),
and it comes with built-in reporters for the following test frameworks without
any direct dependency on them:

* [Jest](https://www.npmjs.com/package/jest)
* [Mocha](https://www.npmjs.com/package/mocha)
* [Karma](https://www.npmjs.com/package/karma)

## Usage
Full API documentation:
[https://mtkennerly.github.io/kelonio/modules/\_index\_.html](https://mtkennerly.github.io/kelonio/modules/_index_.html)

For simple, one-off checks, like in the console or a script, use the `measure`
function:

```typescript
import { measure } from "kelonio";
import axios from "axios";

measure(() => axios.get("http://www.httpbin.org/get"))
    .then(measurement => console.log(`Mean: ${measurement.mean} ms`));
```

If you measure a function that returns a promise, Kelonio will automatically
measure the time until it's resolved as well. The resulting `measurement`
exposes various stats, like maximum time and standard deviation.

For aggregating results inside of a test framework, use `benchmark.record`.
Click to expand an example:

<details>
  <summary>Example: Jest</summary>
  <div style="padding-left: 5px; border-left: 1px solid black;">

  Jest doesn't currently expose a way to get each individual test's name
  while running, so you have to provide a description to `record()`.

  Tests:

  ```typescript
  import { benchmark } from "kelonio";
  import axios from "axios";

  describe("An HTTP client", () => {
      it("can send GET requests", async () => {
          await benchmark.record(
              ["HTTP client", "GET"],
              () => axios.get("http://www.httpbin.org/get")
          );
      }, 30_000);

      it("can send POST requests", async () => {
          await benchmark.record(
              ["HTTP client", "POST"],
              () => axios.post("http://www.httpbin.org/post"),
              { iterations: 10, meanUnder: 10 },
          );
      }, 30_000);
  });
  ```

  Output:

  ```
  FAIL ./index.test.ts (16.576s)
    An HTTP client
      √ can send GET requests (8332ms)
      × can send POST requests (508ms)

    ● An HTTP client › can send POST requests

      Mean time of 49.43073600000001 ms exceeded threshold of 10 ms

  Test Suites: 1 failed, 1 total
  Tests:       1 failed, 1 passed, 2 total
  Snapshots:   0 total
  Time:        18.296s

  - - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
  HTTP client:
    GET:
      83.25152 ms (+/- 58.77542 ms) from 100 iterations
    POST:
      49.43074 ms (+/- 2.39217 ms) from 10 iterations
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ```

  The first time on each line is the mean duration, and the `+/-` time is
  the margin of error at a 95% confidence level.

  </div>
</details>

<details>
  <summary>Example: Mocha</summary>
  <div style="padding-left: 5px; border-left: 1px solid black;">

  The Mocha reporter can automatically infer the descriptions from the test
  names, but you're still free to pass additional descriptions to `record()`,
  such as if one test performs several different measurements.

  Tests:

  ```typescript
  import { benchmark } from "kelonio";
  import axios from "axios";

  describe("An HTTP client", () => {
      it("can send GET requests", async function (this: Mocha.Test) {
          this.timeout(30_000);
          await benchmark.record(() => axios.get("http://www.httpbin.org/get"));
      });

      it("can send POST requests", async function (this: Mocha.Test) {
          this.timeout(30_000);
          await benchmark.record(
              () => axios.post("http://www.httpbin.org/post"),
              { iterations: 10, meanUnder: 10 },
          );
      });
  });
  ```

  Output:

  ```
    An HTTP client
      √ can send GET requests
      1) can send POST requests


    1 passing (8332ms)
    1 failing

    1) An HTTP client
        can send POST requests:
      Error: Mean time of 49.43073600000001 ms exceeded threshold of 10 ms


  - - - - - - - - - - - - - - - - - Performance - - - - - - - - - - - - - - - - -
  An HTTP client:
    can send GET requests:
      83.25152 ms (+/- 58.77542 ms) from 100 iterations
    can send POST requests:
      49.43074 ms (+/- 2.39217 ms) from 10 iterations
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ```

  The first time on each line is the mean duration, and the `+/-` time is
  the margin of error at a 95% confidence level.

  </div>
</details>

Refer to the `examples` folder for sample projects that integrate Kelonio with
different test frameworks.

## Versioning
This project uses [Semantic Versioning](https://semver.org). Public API:

* All items that can be imported `from "kelonio"` and their public attributes.
* The location of reporter modules:
  * `node_modules/kelonio/out/plugin/jestReporter.js`.
    * `node_modules/kelonio/out/plugin/jestReporterSetup.js`.
  * `node_modules/kelonio/out/plugin/karmaReporter.js`.
    * `node_modules/kelonio/out/plugin/karmaReporterSetup.js`.
  * `node_modules/kelonio/out/plugin/mochaReporter.js`.

## Comparison with other tools
* [Benchmark](https://www.npmjs.com/package/benchmark):
  * Requires defining tests in its own framework.
  * Doesn't provide a default report format, so you have to write your own
    reporting in callbacks.
  * Callbacks must be classic `function () {}` style because they need access
    to `this`, which is not accounted for by
    [@types/benchmark](https://www.npmjs.com/package/@types/benchmark).
* [Nanobench](https://www.npmjs.com/package/nanobench):
  * Requires defining tests in its own framework.
  * The CLI can only handle JavaScript code, so in a TypeScript project,
    you either have to compile the tests in addition to the main source
    or you have to use `ts-node` (which appears to degrade the performance results).
  * No typings available for TypeScript.
* [Matcha](https://www.npmjs.com/package/matcha):
  * Requires defining tests in its own framework.
  * The CLI can only handle JavaScript code, so in a TypeScript project,
    you either have to compile the tests instead of just the main source
    or you have to use `ts-node` (which appears to degrade the performance results).
  * No typings available for TypeScript.
  * Depends on [Electron](https://www.npmjs.com/package/electron).

## Development
Please refer to [CONTRIBUTING.md](./CONTRIBUTING.md).
