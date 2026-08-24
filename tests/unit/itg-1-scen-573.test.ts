import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-573: [error] 課題優先度判定機能 - 課題内容がundefinedのとき影響度スコア計算エラーが発生する
  test('課題内容がundefinedの場合、影響度スコア計算エラーが発生する', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockImplementation((content: string | undefined) => {
        if (content === undefined) {
          throw new TypeError('課題内容が無効です');
        }
        return 75;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: undefined as any,
      occurrenceFrequency: 5,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => 
      calculateIssuePriorityScore(invalidInput, mockTextAnalysisServiceAdapter)
    ).toThrow(/課題内容/);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(undefined);
  });
});