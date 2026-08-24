import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-605
  test('複数の抽出課題に対して優先度スコアが一括付与される', () => {
    const issues = [
      {
        issueId: 'issue-001',
        issueContent: 'データベース接続エラー',
        occurrenceFrequency: 5,
        impactScore: 85,
        affectedTeamCount: 4,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-002',
        issueContent: 'メモリリーク検出',
        occurrenceFrequency: 3,
        impactScore: 60,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-003',
        issueContent: 'ドキュメント更新遅延',
        occurrenceFrequency: 2,
        impactScore: 35,
        affectedTeamCount: 1,
        resolutionDaysAverage: 1,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      },
    ];

    const results = issues.map((issue) => calculateIssuePriorityScore(issue));

    expect(results).toHaveLength(3);
    expect(results[0]).toHaveProperty('issueId', 'issue-001');
    expect(results[0]).toHaveProperty('priorityScore');
    expect(results[0].priorityScore).toBeGreaterThanOrEqual(1);
    expect(results[0].priorityScore).toBeLessThanOrEqual(100);
    expect(results[0].priorityScore).toBe(95);

    expect(results[1]).toHaveProperty('issueId', 'issue-002');
    expect(results[1]).toHaveProperty('priorityScore');
    expect(results[1].priorityScore).toBeGreaterThanOrEqual(1);
    expect(results[1].priorityScore).toBeLessThanOrEqual(100);
    expect(results[1].priorityScore).toBe(60);

    expect(results[2]).toHaveProperty('issueId', 'issue-003');
    expect(results[2]).toHaveProperty('priorityScore');
    expect(results[2].priorityScore).toBeGreaterThanOrEqual(1);
    expect(results[2].priorityScore).toBeLessThanOrEqual(100);
    expect(results[2].priorityScore).toBe(35);

    results.forEach((result) => {
      expect(result).toHaveProperty('priorityRank');
      expect(['高', '中', '低']).toContain(result.priorityRank);
      expect(result).toHaveProperty('scoreBreakdown');
      expect(result.scoreBreakdown).toHaveProperty('frequencyScore');
      expect(result.scoreBreakdown).toHaveProperty('impactScore');
      expect(result.scoreBreakdown).toHaveProperty('resolutionDifficultyScore');
      expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
      expect(result).toHaveProperty('colorCode');
      expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);
      expect(result).toHaveProperty('calculatedAt');
      expect(typeof result.calculatedAt).toBe('string');
    });

    expect(results[0].priorityScore).toBeGreaterThan(results[1].priorityScore);
    expect(results[1].priorityScore).toBeGreaterThan(results[2].priorityScore);

    expect(results[0].priorityRank).toBe('高');
    expect(results[1].priorityRank).toBe('中');
    expect(results[2].priorityRank).toBe('低');

    expect(results[0].colorCode).toBe('#FF0000');
    expect(results[1].colorCode).toBe('#FFFF00');
    expect(results[2].colorCode).toBe('#00FF00');
  });
});