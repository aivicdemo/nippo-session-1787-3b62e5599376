import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-2981
  test('[error] 課題優先度スコア自動計算機能 - 課題抽出結果の配列内に null 要素が混在しているとき、優先度スコア計算がエラーになる', () => {
    const invalidIssueData = {
      issueId: 'issue-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
      extractedKeywords: [
        { keyword: '納期遅延', frequency: 3 },
        null,
        { keyword: 'バグ報告', frequency: 2 }
      ]
    };

    expect(() => {
      calculateIssuePriorityScore(invalidIssueData as any);
    }).toThrow(/課題抽出結果に無効なデータが含まれています/);
  });
});