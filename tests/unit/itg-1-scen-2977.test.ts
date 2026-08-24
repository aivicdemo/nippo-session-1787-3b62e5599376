import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算機能', () => {
  // SCEN-2977
  test('日報テキストが null のとき、課題抽出と優先度スコア計算がエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: null as any,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/課題分析が一時的に利用できません/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(null);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});