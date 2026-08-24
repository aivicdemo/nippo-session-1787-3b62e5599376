import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-571: [error] 課題優先度判定機能 - 課題内容が空文字列のとき影響度スコア計算エラーが発生する
  test('課題内容が空文字列のとき影響度スコア計算エラーが発生し、エラーメッセージが表示される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockImplementation(() => {
        throw new Error('Empty issue content provided to assessImpactScore');
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: '',
      occurrenceFrequency: 3,
      impactScore: 0,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/Empty issue content provided to assessImpactScore/);
  });
});