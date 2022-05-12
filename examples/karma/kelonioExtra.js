const { Criteria } = require("kelonio");

function extraReport(benchmark) {
    const fastest = benchmark.find(Criteria.Fastest);
    if (fastest) {
        return `
= = Custom Report = =
Fastest: "${fastest.description.join("/")}" (${fastest.mean} ms)
= = = = = = = = = = =
`;
    }
}

module.exports = {
    extraReport,
};
