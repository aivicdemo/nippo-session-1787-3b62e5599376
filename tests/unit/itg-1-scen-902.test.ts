import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-902
  test('[error] 日報テキストがundefinedのとき課題抽出が失敗し例外をスローする', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('日報テキストが不正です');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: undefined as any,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-a',
    };

    expect(() => {
      calculateIssuePriorityScore(invalidInput, mockTextAnalysisService);
    }).toThrow(/日報テキストが不正です/);

    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
  });
});