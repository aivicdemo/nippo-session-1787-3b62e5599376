import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出・優先度付けロジック', () => {
  // SCEN-206
  test('日報データが1件も存在しないときは警告メッセージとともに空の課題リストを返す', () => {
    const analysisStartDate = new Date('2024-12-17');
    const analysisEndDate = new Date('2025-01-15');
    const emptyReports: never[] = [];

    const result = extractAndRankIssuesFromReports({
      reports: emptyReports,
      analysisStartDate,
      analysisEndDate,
    });

    expect(result.issues).toEqual([]);
    expect(result.totalIssueCount).toBe(0);
    expect(result.lowConfidenceIssueCount).toBe(0);
    expect(result.warningMessage).toBe('課題データが不足しています。データが蓄積されるまでお待ちください');
  });
});