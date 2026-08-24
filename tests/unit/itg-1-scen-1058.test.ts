import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与', () => {
  // SCEN-1058
  test('抽出キーワードが空配列のとき、影響度判定がエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockImplementation((keywords: string[]) => {
        if (!keywords || keywords.length === 0) {
          throw new Error('抽出されたキーワードが存在しません');
        }
        return 75;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 3,
      impactScore: 0,
      affectedTeamCount: 1,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/抽出されたキーワードが存在しません/);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith([]);
  });
});