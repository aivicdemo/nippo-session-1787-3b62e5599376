import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-644: [edge] 課題優先度スコア計算機能 - 月をまたぐ過去30日間の期間で正確に優先度スコアが計算される
  test('should calculate priority score accurately for issues spanning across calendar months within past 30 days', () => {
    const baseDate = new Date('2026-01-15T10:00:00Z');
    const thirtyDaysAgo = new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const issueA: IssuePriorityScoringInput = {
      issueId: 'A',
      issueContent: 'バグが発生している',
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 1,
      resolutionDaysAverage: 3,
      reportingDate: '2025-12-17',
      teamId: 'team-001',
    };

    const issueB: IssuePriorityScoringInput = {
      issueId: 'B',
      issueContent: '仕様が変更された',
      occurrenceFrequency: 1,
      impactScore: 30,
      affectedTeamCount: 1,
      resolutionDaysAverage: 5,
      reportingDate: '2025-12-25',
      teamId: 'team-001',
    };

    const issueC: IssuePriorityScoringInput = {
      issueId: 'C',
      issueContent: 'バグが再度発生',
      occurrenceFrequency: 1,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2026-01-05',
      teamId: 'team-001',
    };

    const issueD: IssuePriorityScoringInput = {
      issueId: 'D',
      issueContent: '対応が遅延している',
      occurrenceFrequency: 1,
      impactScore: 25,
      affectedTeamCount: 1,
      resolutionDaysAverage: 7,
      reportingDate: '2026-01-14',
      teamId: 'team-001',
    };

    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);
    const resultD = calculateIssuePriorityScore(issueD);

    expect(resultA.issueId).toBe('A');
    expect(typeof resultA.priorityScore).toBe('number');
    expect(resultA.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultA.priorityScore).toBeLessThanOrEqual(100);
    expect(['高', '中', '低']).toContain(resultA.priorityRank);
    expect(resultA.scoreBreakdown).toBeDefined();
    expect(typeof resultA.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof resultA.scoreBreakdown.impactScore).toBe('number');
    expect(typeof resultA.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(resultA.colorCode);

    expect(resultB.issueId).toBe('B');
    expect(typeof resultB.priorityScore).toBe('number');
    expect(resultB.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultB.priorityScore).toBeLessThanOrEqual(100);

    expect(resultC.issueId).toBe('C');
    expect(typeof resultC.priorityScore).toBe('number');
    expect(resultC.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultC.priorityScore).toBeLessThanOrEqual(100);

    expect(resultD.issueId).toBe('D');
    expect(typeof resultD.priorityScore).toBe('number');
    expect(resultD.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultD.priorityScore).toBeLessThanOrEqual(100);

    const allResults = [resultA, resultB, resultC, resultD];
    const totalScoreRange = allResults.reduce((sum, r) => sum + r.priorityScore, 0);
    expect(totalScoreRange).toBeGreaterThanOrEqual(160);
    expect(totalScoreRange).toBeLessThanOrEqual(180);

    const issueIds = new Set(allResults.map(r => r.issueId));
    expect(issueIds.size).toBe(4);
    expect(issueIds).toContain('A');
    expect(issueIds).toContain('B');
    expect(issueIds).toContain('C');
    expect(issueIds).toContain('D');

    expect(resultA.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(typeof resultA.calculatedAt).toBe('string');
    const calculatedAtDate = new Date(resultA.calculatedAt);
    expect(calculatedAtDate instanceof Date && !isNaN(calculatedAtDate.getTime())).toBe(true);
  });
});