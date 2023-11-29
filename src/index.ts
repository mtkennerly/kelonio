
import { JestReporter, KarmaReporter, MochaReporter } from "./reporters";

export { JestReporter, KarmaReporter, MochaReporter };

import { Benchmark } from "./Benchmark";

export {
    Benchmark,
    Criteria,
    BenchmarkEventEmitter,
    BenchmarkData,
} from "./Benchmark";

export {
    MeasureOptions,
    PerformanceError,
    Measurement,
    measure,
} from "./measure";


/**
 * Default [[Benchmark]] instance for shared usage throughout your tests.
 * Each instance stores its own state from measurement results, so if you
 * want to avoid global state, you can create additional instances as well.
 */
export const benchmark = new Benchmark();
