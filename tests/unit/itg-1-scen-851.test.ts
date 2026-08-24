import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-851: [error] 課題影響度判定・優先度スコア付与機能 - 影響度スコアが0未満で返されたときエラーになる
  test('影響度スコアが0未満の場合、エラーをスローすること', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(-5.0),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'バグが発生している',
      occurrenceFrequency: 3,
      impactScore: -5.0,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-A',
    };

    expect(() => calculateIssuePriorityScore(input, mockTextAnalysisService)).toThrow(/影響度スコア/);
  });
});