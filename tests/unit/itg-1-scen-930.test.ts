import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-930: [edge] 課題優先度スコア算出機能 - 重複する課題キーワードが含まれるとき、発生頻度に重複分が正しく集計される
  test('重複するキーワード「ネットワーク」が3回出現したとき、発生頻度が3として集計される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'ネットワーク障害により対応。ネットワーク関連の調査を実施。ネットワーク復旧作業中',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(87);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    expect(result.scoreBreakdown.impactScore).toBe(30);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(17);
    expect(result.colorCode).toBe('#FF0000');
    expect(typeof result.calculatedAt).toBe('string');
  });
});