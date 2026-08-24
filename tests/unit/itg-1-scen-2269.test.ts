import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2269
  test('[normal] 課題影響度判定機能 - 抽出されたキーワードが0件の場合、課題解決速度スコアは0で算出される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn().mockResolvedValue(45),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システムが遅い',
      occurrenceFrequency: 5,
      impactScore: 45,
      affectedTeamCount: 3,
      resolutionDaysAverage: 7,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: expect.any(String),
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: 0,
      },
      colorCode: expect.any(String),
      calculatedAt: expect.any(String),
    });

    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});