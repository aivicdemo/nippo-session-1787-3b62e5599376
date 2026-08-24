import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('優先度付きレポート生成機能', () => {
  // SCEN-1642: [error] 分析結果データが空のまま部長へのレポート生成を実行しようとしたとき、処理を中止しエラーを返す
  test('分析結果データが空の場合はエラーを返す', () => {
    const emptyAnalysisIssue = {
      issueId: '',
      issueContent: '',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0,
      reportingDate: '2024-01-15',
      teamId: '',
    };

    expect(() => calculateIssuePriorityScore(emptyAnalysisIssue)).toThrow(
      /分析結果データ/,
    );
  });
});