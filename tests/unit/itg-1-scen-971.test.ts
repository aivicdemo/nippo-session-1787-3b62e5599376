import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算機能', () => {
  test('SCEN-971: 重複キーワードを含む課題リストが重複排除されて色分け表示される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '顧客対応が頻繁に発生しており、DB障害の影響が大きい',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(72);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(30);
    expect(result.scoreBreakdown.impactScore).toBe(30);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(12);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

interface IssuePriorityScoringInput {
  issueId: string;
  issueContent: string;
  occurrenceFrequency: number;
  impactScore: number;
  affectedTeamCount: number;
  resolutionDaysAverage: number;
  reportingDate: string;
  teamId: string;
}

interface ScoreBreakdown {
  frequencyScore: number;
  impactScore: number;
  resolutionDifficultyScore: number;
}

interface IssuePriorityScoringOutput {
  issueId: string;
  priorityScore: number;
  priorityRank: string;
  scoreBreakdown: ScoreBreakdown;
  colorCode: string;
  calculatedAt: string;
}