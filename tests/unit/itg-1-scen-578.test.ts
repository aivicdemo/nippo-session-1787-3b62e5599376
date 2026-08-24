import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-578: [error] 課題優先度判定機能 - 報告者IDが空文字列のとき優先度判定エラーが発生する
  test('報告者IDが空文字列のとき、INVALID_REPORTER_IDエラーオブジェクトを返す', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: '重要な障害が発生',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
      reporterId: '',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: null,
      priorityRank: null,
      scoreBreakdown: null,
      colorCode: null,
      calculatedAt: null,
      error: {
        code: 'INVALID_REPORTER_ID',
        message: '報告者IDが空文字列です',
      },
    });
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe('INVALID_REPORTER_ID');
    expect(result.error.message).toBe('報告者IDが空文字列です');
  });
});