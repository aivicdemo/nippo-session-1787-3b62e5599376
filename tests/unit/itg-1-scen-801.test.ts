import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付け', () => {
  // SCEN-801
  test('抽出済み課題キーワードリストが空配列のとき処理が中断される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生している',
      occurrenceFrequency: 5,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: null,
      priorityRank: null,
      scoreBreakdown: null,
      colorCode: null,
      calculatedAt: expect.any(String),
      skipReason: '課題キーワードが抽出できないため、スコア算出をスキップしました',
    });
  });
});