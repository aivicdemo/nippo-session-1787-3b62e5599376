import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出・優先度付け', () => {
  // SCEN-438
  test('reports配列が空のとき、NoReportsProvidedErrorを発生させる', () => {
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-15T23:59:59Z');
    const minimumConfidenceThreshold = 50;

    expect(() =>
      extractAndRankIssuesFromReports({
        reports: [],
        analysisStartDate,
        analysisEndDate,
        minimumConfidenceThreshold,
      })
    ).toThrow(/集約対象の日報が存在しません/);
  });
});