import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('aggregateReportSubmissionStatus - 報告提出状況の集計', () => {
  test('SCEN-3031: 照会対象日付が null のとき、該当日の提出状況を特定できずエラーになる', () => {
    const input = {
      teamId: 'team-001',
      reportDate: null as unknown as string,
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/日付/);
  });
});