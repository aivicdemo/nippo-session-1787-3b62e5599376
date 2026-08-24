import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-793
  test('優先度スコアが異なる課題が1件の場合、そのまま結果として返される', () => {
    const inputIssues = [
      {
        issueId: 'ISSUE-001',
        keyword: '顧客対応遅延',
        priorityScore: 75,
        frequency: 5,
        impactScore: 80,
      },
    ];

    const result = extractAndRankIssueKeywords(inputIssues);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      issueId: 'ISSUE-001',
      keyword: '顧客対応遅延',
      priorityScore: 75,
      frequency: 5,
      impactScore: 80,
    });
  });
});