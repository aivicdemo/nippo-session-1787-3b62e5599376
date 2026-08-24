import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算機能', () => {
  test('SCEN-2976: 抽出された課題キーワード配列が空配列のとき、エラーがスローされること', () => {
    const emptyKeywordsInput: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
      extractedKeywords: []
    };

    expect(() => {
      calculateIssuePriorityScore(emptyKeywordsInput);
    }).toThrow(/課題キーワード/);
  });
});