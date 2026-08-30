import { getReportSubmissionTimestamp } from '../../src/logic/report-persistence';

describe('朝会報告管理システム', () => {
  test('SCEN-161: 日報レコードは存在するが送信時刻が記録されていない場合、適切なエラーをthrowする', () => {
    const reportId = 'report-001';
    const requestingUserId = 'user-456';

    expect(() =>
      getReportSubmissionTimestamp({
        reportId,
        requestingUserId,
      })
    ).toThrow(/日報の送信時刻が記録されていません。報告ID: report-001/);
  });
});