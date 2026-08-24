import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与機能', () => {
  // SCEN-1662: [edge] 課題優先度スコア計算機能 - 前週のデータ件数が業務上の最大規模（10000件超）の場合、スコア計算が完了する
  test('10001件の大規模日報データセットに対して優先度スコア計算が正常に完了し、全件にスコアが割り当てられること', async () => {
    const baseDate = new Date('2024-01-15T09:00:00Z');
    const largeDataset: IssuePriorityScoringInput[] = [];

    for (let i = 1; i <= 10001; i++) {
      const testIssue: IssuePriorityScoringInput = {
        issueId: `issue-${String(i).padStart(5, '0')}`,
        issueContent: `課題内容_${i}: チーム内の進捗遅延に関する課題`,
        occurrenceFrequency: (i % 30) + 1,
        impactScore: (i % 100),
        affectedTeamCount: (i % 5) + 1,
        resolutionDaysAverage: (i % 20) + 1,
        reportingDate: new Date(baseDate.getTime() - ((i % 7) * 24 * 60 * 60 * 1000)).toISOString(),
        teamId: `team-${String((i % 10) + 1).padStart(2, '0')}`
      };
      largeDataset.push(testIssue);
    }

    const processedResults: IssuePriorityScoringOutput[] = [];
    const startTime = performance.now();
    const initialMemory = process.memoryUsage().heapUsed;

    for (const issueInput of largeDataset) {
      const result = calculateIssuePriorityScore(issueInput);
      processedResults.push(result);
    }

    const endTime = performance.now();
    const finalMemory = process.memoryUsage().heapUsed;
    const executionTimeMs = endTime - startTime;
    const memoryDeltaMb = (finalMemory - initialMemory) / (1024 * 1024);

    expect(processedResults.length).toBe(10001);

    for (const result of processedResults) {
      expect(result.issueId).toMatch(/^issue-\d{5}$/);
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
      expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
      expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }

    const scoreSampleA = processedResults[0];
    const scoreBreakdownSum = scoreSampleA.scoreBreakdown.frequencyScore + 
                               scoreSampleA.scoreBreakdown.impactScore + 
                               scoreSampleA.scoreBreakdown.resolutionDifficultyScore;
    expect(scoreBreakdownSum).toBe(scoreSampleA.priorityScore);

    const highPriorityIssues = processedResults.filter(r => r.priorityRank === '高');
    const mediumPriorityIssues = processedResults.filter(r => r.priorityRank === '中');
    const lowPriorityIssues = processedResults.filter(r => r.priorityRank === '低');

    expect(highPriorityIssues.length).toBeGreaterThan(0);
    expect(mediumPriorityIssues.length).toBeGreaterThan(0);
    expect(lowPriorityIssues.length).toBeGreaterThan(0);
    expect(highPriorityIssues.length + mediumPriorityIssues.length + lowPriorityIssues.length).toBe(10001);

    for (const highIssue of highPriorityIssues) {
      expect(highIssue.priorityScore).toBeGreaterThanOrEqual(70);
    }

    for (const mediumIssue of mediumPriorityIssues) {
      expect(mediumIssue.priorityScore).toBeGreaterThanOrEqual(40);
      expect(mediumIssue.priorityScore).toBeLessThan(70);
    }

    for (const lowIssue of lowPriorityIssues) {
      expect(lowIssue.priorityScore).toBeLessThan(40);
    }

    expect(executionTimeMs).toBeLessThan(120000);
    expect(memoryDeltaMb).toBeLessThan(2000);
  });
});