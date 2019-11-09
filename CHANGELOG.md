## Unreleased

* Made `JestReporter.initializeKelonio()` enable data serialization so that
  you do not have to do that explicitly in your `jest.setup.js`.
* Narrowed the type of the `Benchmark.record()` argument `options` from
  `Partial<MeasureOptions>` to `Partial<Omit<MeasureOptions, "verify">>`
  because the function always overrides `verify` to `true`.

## v0.1.0 (2019-11-09)

* Initial release.
