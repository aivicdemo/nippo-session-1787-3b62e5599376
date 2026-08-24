import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('優先度付きレポート生成機能 - 分析結果データ null 処理', () => {
  // SCEN-1641
  test('分析結果データが null のまま部長へのレポート生成を実行しようとしたとき、処理を中止しエラーを返す', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    const result = calculateIssuePriorityScore(null);

    expect(result).toEqual({
      code: 'ANALYSIS_DATA_NULL',
      message: '分析結果データが null のため部長レポート生成は実行できません',
      severity: 'error'
    });
  });
});