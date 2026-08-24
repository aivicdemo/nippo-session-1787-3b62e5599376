import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与機能', () => {
  // SCEN-567: [error] 課題優先度判定機能 - 日報がundefinedのとき課題抽出エラーが発生する
  test('日報テキストがundefinedの場合、エラーを発生させる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue(undefined),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput = {
      issueId: 'issue-001',
      issueContent: undefined,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() =>
      calculateIssuePriorityScore(invalidInput, mockTextAnalysisServiceAdapter)
    ).toThrow(/日報テキスト|Invalid report data/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});