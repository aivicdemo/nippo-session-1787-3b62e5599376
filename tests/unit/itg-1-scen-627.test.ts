import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-627
  test('TextAnalysisServiceAdapter の assessImpactScore が失敗したときに、デフォルト影響度スコア50で処理を継続する', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害', '納期遅延']
      }),
      assessImpactScore: jest.fn().mockRejectedValueOnce(new Error('API call failed')),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生し、全チーム業務に影響が出ている',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-alpha'
    };

    const result = calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(50);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});