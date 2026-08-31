/** @type {import('jest').Config} */
module.exports = {
  testMatch: ["**/tests/unit/itg-1-*.test.ts","**/tests/unit/itg-1-*.test.js"],
  transform: { "^.+\\.tsx?$": "ts-jest" },
  testEnvironment: "node",
};
