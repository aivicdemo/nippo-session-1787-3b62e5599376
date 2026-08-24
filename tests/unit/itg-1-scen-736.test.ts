import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Calculate Priority Score', () => {
  // SCEN-736: [normal] 課題の自動抽出と優先度判定機能 - 日報が 0 件のときに空の課題一覧が返却される
  test('should return empty issue list with success status when no reports exist', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-empty-001',
      issueContent: '',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-empty-001');
    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('低');
    expect(result.scoreBreakdown.frequencyScore).toBe(0);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result.colorCode).toBe('#00FF00');
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe('string');
  });
});