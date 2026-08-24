import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation with Color Coding', () => {
  // SCEN-941: [error] 課題優先度スコア計算・色分け表示機能 - 優先度スコアが null のとき色分けロジックがエラーを返す
  test('should throw error when impact score assessment returns null causing invalid priority score calculation', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout during peak hours affecting all services',
      occurrenceFrequency: 5,
      impactScore: null,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'TEAM-A',
    };

    expect(() => {
      calculateIssuePriorityScore(
        input,
        mockTextAnalysisServiceAdapter
      );
    }).toThrow(/優先度スコア|priority score|null|undefined|数値型/i);
  });
});