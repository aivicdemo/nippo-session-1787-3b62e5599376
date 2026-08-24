import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況の集計機能', () => {
  // SCEN-3034
  test('ユーザーIDリストが空配列のとき、エラーコード EMPTY_USER_LIST を返す', () => {
    const input: Parameters<typeof aggregateReportSubmissionStatus>[0] = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-admin-001',
      userIds: [],
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result).toHaveProperty('errorCode', 'EMPTY_USER_LIST');
    expect(result).toHaveProperty('errorMessage');
    expect(result.errorMessage).toMatch(/集計対象ユーザーが存在しません/);
  });
});