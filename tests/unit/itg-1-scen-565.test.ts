import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-565: [error] 課題優先度判定機能 - 日報が空文字列のとき課題抽出エラーが発生する
  test('日報テキストが空文字列のとき、TextAnalysisServiceAdapterのエラーが伝播される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('InvalidInputError: 日報テキストが空です。課題抽出を実行できません。');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: '',
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/日報テキストが空/);
  });
});