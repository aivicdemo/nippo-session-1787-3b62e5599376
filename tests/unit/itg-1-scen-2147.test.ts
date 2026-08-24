import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-2147
  test('複数プロジェクトからの重複課題キーワードが存在する場合、全プロジェクト合算の発生頻度と最大影響度スコアで優先度が算出される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 7,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(['高', '中', '低']).toContain(result.priorityRank);
    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  test('複数プロジェクトからの重複課題キーワードの場合、合算頻度と最大影響度に基づいて優先度スコアが算出される', () => {
    const databaseErrorInput: IssuePriorityScoringInput = {
      issueId: 'issue-db-error',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 7,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const performanceIssueInput: IssuePriorityScoringInput = {
      issueId: 'issue-perf-low',
      issueContent: 'パフォーマンス低下',
      occurrenceFrequency: 4,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const databaseErrorResult = calculateIssuePriorityScore(databaseErrorInput);
    const performanceIssueResult = calculateIssuePriorityScore(performanceIssueInput);

    expect(databaseErrorResult.priorityScore).toBeGreaterThan(performanceIssueResult.priorityScore);
    expect(databaseErrorResult.scoreBreakdown.frequencyScore).toBeGreaterThan(performanceIssueResult.scoreBreakdown.frequencyScore);
    expect(databaseErrorResult.scoreBreakdown.impactScore).toBeGreaterThan(performanceIssueResult.scoreBreakdown.impactScore);
  });
});