import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-513: [edge] 課題優先度スコア計算機能 - 1名のみが課題キーワードを報告した場合、発生頻度が10%で計算される
  test('1名のみが課題キーワードを報告した場合、発生頻度が10%として計算される', () => {
    const issueId = 'issue-001';
    const issueContent = 'データベース接続エラーが発生している';
    const occurrenceFrequency = 1;
    const totalTeamMembers = 10;
    const frequencyPercentage = (occurrenceFrequency / totalTeamMembers) * 100;
    const impactScore = 45;
    const affectedTeamCount = 2;
    const resolutionDaysAverage = 2.5;
    const reportingDate = '2024-01-15T09:30:00Z';
    const teamId = 'team-dev-001';

    const input: IssuePriorityScoringInput = {
      issueId,
      issueContent,
      occurrenceFrequency,
      impactScore,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result).toBeDefined();
    expect(result.issueId).toBe(issueId);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    const expectedFrequencyScore = Math.min((frequencyPercentage / 100) * 40, 40);
    expect(result.scoreBreakdown.frequencyScore).toBe(expectedFrequencyScore);

    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toBeDefined();

    const calculatedAtDate = new Date(result.calculatedAt);
    expect(calculatedAtDate).toBeInstanceOf(Date);
    expect(calculatedAtDate.getTime()).toBeGreaterThan(0);
  });
});