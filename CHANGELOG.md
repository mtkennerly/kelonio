## v0.9.0 (2023-02-19)

* Added:
  * A `totalDuration` field in the `Measurement` class and related output in the reporting.
    This is mainly useful when `serial` is false, so you can see the total real time spent.
    ([Contributed by stephenh](https://github.com/mtkennerly/kelonio/pull/12))

## v0.8.0 (2022-05-12)

* Added:
  * Support for an `extensions` option in each reporter. Currently, this allows
    printing extra reports after the main one.

## v0.7.0 (2021-10-08)

* Added:
  * `Benchmark.measurements` getter for a list of `Measurement` from the raw
    `Benchmark.data`.
  * `Benchmark.find()` and `Criteria` to determine the fastest/slowest
    measurement.
  * `Measurement.description` field, which is used by `Benchmark.measurements`
    and `Benchmark.find()` so that each measurement retains its context.
* Fixed:
  * Updated mathjs dependency to resolve a security vulnerability.
    ([Contributed by buge](https://github.com/mtkennerly/kelonio/pull/11))

## v0.6.0 (2021-03-01)

* Added `keepStateAtStart` option for the Jest reporter.
  ([Contributed by thomaschaplin](https://github.com/mtkennerly/kelonio/pull/7))

## v0.5.0 (2021-02-11)

* Added `printReportAtEnd` reporter option.
  ([Contributed by thomaschaplin](https://github.com/mtkennerly/kelonio/pull/4))
* Fixed an error in the Jest reporter when no Kelonio tests were executed.
  ([Contributed by thomaschaplin](https://github.com/mtkennerly/kelonio/pull/6))

## v0.4.0 (2021-02-05)

* Added `keepStateAtEnd` option for the Jest reporter.
  ([Contributed by thomaschaplin and electblake](https://github.com/mtkennerly/kelonio/pull/2))
* Added `marginOfErrorUnder` and `standardDeviationUnder` measurement options.
  ([Contributed by thomaschaplin](https://github.com/mtkennerly/kelonio/pull/3))

## v0.3.0 (2019-11-22)

* Added a reporter for Karma and a corresponding example project.
* Adjusted Kelonio so that it can work in the browser (at least in conjunction
  with something like Browserify).
* Added `kelonio/out/plugin/jestReporterSetup.js` as an alternative to writing
  your own `jest.setup.js` to call `JestReporter.initializeKelonio()`.
* Added `Benchmark.events`, an event emitter.
* Added `Benchmark.incorporate()` for reporters to add data more easily
  in response to events.
* Moved the compiled reporters from `kelonio/out/*Reporter.js` to
  `kelonio/out/plugin/*Reporter.js`. This allows more easily accommodating
  export requirements for various frameworks, while still being able to export
  the classes normally from Kelonio's entry point.
* Removed data serialization and `baseDescription` from `Benchmark` since that
  can now be handled directly in reporters via the new emitter.

## v0.2.0 (2019-11-09)

* Made `JestReporter.initializeKelonio()` enable data serialization so that
  you do not have to do that explicitly in your `jest.setup.js`.
* Narrowed the type of the `Benchmark.record()` argument `options` from
  `Partial<MeasureOptions>` to `Partial<Omit<MeasureOptions, "verify">>`
  because the function always overrides `verify` to `true`.

## v0.1.0 (2019-11-09)

* Initial release.
