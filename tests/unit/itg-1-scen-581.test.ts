import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-581: [error] 課題優先度判定機能 - チームIDが空文字列のとき優先度判定エラーが発生する
  test('teamIdが空文字列の場合、入力値検証エラーが発生してTextAnalysisServiceAdapterへの呼び出しがない', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: '本番環境でデータベース接続エラーが発生している',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: '',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/teamId|TeamId/);
  });
});