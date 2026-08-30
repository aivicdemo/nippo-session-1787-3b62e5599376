import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題キーワード抽出と優先度ランク付け', () => {
  // SCEN-214
  test('課題テキストが空文字列のときは抽出結果から除外される', () => {
    const analysisStartDate = new Date('2024-12-16T00:00:00Z');
    const analysisEndDate = new Date('2025-01-14T23:59:59Z');

    const input: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: 'report-001',
          reportDate: analysisEndDate,
          issueText: '',
          teamId: 'team-001',
        },
      ],
      analysisStartDate,
      analysisEndDate,
    };

    const result = extractAndRankIssuesFromReports(input);

    expect(result.issues).toEqual([]);
    expect(result.lowConfidenceIssueCount).toBe(0);
    expect(result.totalIssueCount).toBe(0);
    expect(result.analysisTimestamp).toBeDefined();
  });
});