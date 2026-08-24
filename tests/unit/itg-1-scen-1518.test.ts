import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け表示機能', () => {
  // SCEN-1518
  test('課題優先度スコア算出機能 - TextAnalysisServiceAdapterが正常に課題キーワードと影響度スコアを返した場合、優先度スコアが正しく算出される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['システム障害', '納期遅延'],
        frequencies: {
          'システム障害': 3,
          '納期遅延': 2,
        },
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'システム障害') {
          return 75;
        }
        if (keyword === '納期遅延') {
          return 60;
        }
        return 0;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が3回発生し、納期遅延のリスクがある',
      occurrenceFrequency: 5,
      impactScore: 70,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    expect(result.priorityScore).toBe(69);
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.calculatedAt).toBeDefined();
  });
});