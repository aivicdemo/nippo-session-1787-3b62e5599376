import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-3007: [edge] 課題優先度スコア自動計算機能 - 課題発生頻度がちょうど優先度判定の閾値（例：5回）のときスコアが閾値境界値で計算される
  test('発生頻度が閾値5回のとき、中優先度スコア50で計算される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'ネットワーク遅延により定期実行ジョブが失敗する',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(50);
    expect(Number.isInteger(result.priorityScore)).toBe(true);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: 20,
      impactScore: 30,
      resolutionDifficultyScore: 0
    });
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});