import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Validation', () => {
  // SCEN-1144: [error] 抽出課題データ有効性検証機能 - 優先度スコアが欠落しているデータがあるとき検証エラーになる
  test('should return validation error when priorityScore field is missing from extracted issue data', () => {
    const invalidIssueData = {
      issueKeyword: '重大バグ',
      impactScore: 85,
      severity: 'high',
    };

    expect(() => {
      extractAndRankIssueKeywords([invalidIssueData as any]);
    }).toThrow(/priorityScore/);
  });
});