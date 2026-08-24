import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('calculateIssuePriorityScore', () => {
  // SCEN-2795: [edge] 課題影響度判定・波及度スコア計算機能 - 複数チームメンバーの報告から集計した波及度スコアが正確に計算される
  test('should calculate aggregated impact score from multiple team members with duplicate keyword consideration', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn((keyword: string) => {
        const impactScores: { [key: string]: number } = {
          'データベース接続エラー': 45,
          '作業遅延': 30,
          'ネットワーク遅延': 35,
        };
        return impactScores[keyword] || 20;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const issueId = 'issue-001';
    const issueContent = 'チームから複数報告されたデータベース関連の問題';
    const occurrenceFrequency = 3;
    const impactScore = 58;
    const affectedTeamCount = 3;
    const resolutionDaysAverage = 2.5;
    const reportingDate = '2024-01-15';
    const teamId = 'team-001';

    const result = calculateIssuePriorityScore(
      {
        issueId,
        issueContent,
        occurrenceFrequency,
        impactScore,
        affectedTeamCount,
        resolutionDaysAverage,
        reportingDate,
        teamId,
      },
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
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
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);
    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);
    expect(result.priorityScore).toBeGreaterThan(30);
  });
});