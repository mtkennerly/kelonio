const { Criteria } = require("kelonio");

module.exports = {
    extension: {
        extraReport: benchmark => {
            const fastest = benchmark.find(Criteria.Fastest);
            if (fastest) {
                return `
= = Custom Report = =
Fastest: "${fastest.description.join("/")}" (${fastest.mean} ms)
= = = = = = = = = = =
        `;
            }
        }
    }
};
