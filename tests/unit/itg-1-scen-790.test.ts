import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-790
  test('同じ日報データで2回実行した場合、両回とも同じ優先度スコアが算出される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        キーワード1: 5,
        キーワード2: 3,
      }),
      assessImpactScore: jest.fn().mockReturnValue(65),
      classifyIssueSeverity: jest.fn().mockReturnValue('中'),
    };

    const testIssueInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続のタイムアウトが頻発している',
      occurrenceFrequency: 8,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    const firstResult = calculateIssuePriorityScore(
      testIssueInput,
      mockTextAnalysisAdapter
    );

    const secondResult = calculateIssuePriorityScore(
      testIssueInput,
      mockTextAnalysisAdapter
    );

    expect(firstResult.priorityScore).toBe(secondResult.priorityScore);
    expect(firstResult.priorityScore).toBe(72);

    expect(firstResult.scoreBreakdown.frequencyScore).toBe(
      secondResult.scoreBreakdown.frequencyScore
    );
    expect(firstResult.scoreBreakdown.frequencyScore).toBe(32);

    expect(firstResult.scoreBreakdown.impactScore).toBe(
      secondResult.scoreBreakdown.impactScore
    );
    expect(firstResult.scoreBreakdown.impactScore).toBe(26);

    expect(firstResult.scoreBreakdown.resolutionDifficultyScore).toBe(
      secondResult.scoreBreakdown.resolutionDifficultyScore
    );
    expect(firstResult.scoreBreakdown.resolutionDifficultyScore).toBe(14);

    expect(firstResult.priorityRank).toBe(secondResult.priorityRank);
    expect(firstResult.priorityRank).toBe('高');

    expect(firstResult.colorCode).toBe(secondResult.colorCode);
    expect(firstResult.colorCode).toBe('#FF0000');

    expect(new Date(firstResult.calculatedAt).getTime()).toBeGreaterThan(0);
    expect(new Date(secondResult.calculatedAt).getTime()).toBeGreaterThan(0);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(
      2
    );
  });
});