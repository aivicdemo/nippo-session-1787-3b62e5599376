import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring', () => {
  // SCEN-2752: [normal] 課題影響度判定機能 - 同じ課題テキストで2回判定を実行した場合に同じ影響度スコアが返却される
  test('should return consistent impact scores for identical issue content', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(45),
      classifyIssueSeverity: jest.fn(),
    };

    const issueContent = 'データベース接続エラーが発生している';
    
    const input1: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: issueContent,
      occurrenceFrequency: 3,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'TEAM-A',
    };

    const input2: IssuePriorityScoringInput = {
      issueId: 'ISSUE-002',
      issueContent: issueContent,
      occurrenceFrequency: 3,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'TEAM-A',
    };

    const result1: IssuePriorityScoringOutput = calculateIssuePriorityScore(input1, mockTextAnalysisAdapter);
    const result2: IssuePriorityScoringOutput = calculateIssuePriorityScore(input2, mockTextAnalysisAdapter);

    expect(result1.impactScore).toBe(result2.impactScore);
    expect(result1.impactScore).toBeGreaterThanOrEqual(1);
    expect(result1.impactScore).toBeLessThanOrEqual(100);
    expect(result2.impactScore).toBeGreaterThanOrEqual(1);
    expect(result2.impactScore).toBeLessThanOrEqual(100);
  });
});