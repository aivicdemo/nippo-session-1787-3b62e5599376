import { recordSubmissionTimestamp } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信時刻記録', () => {
  // SCEN-049
  test('指定された報告IDが朝会報告テーブルに存在しない場合、ReportNotFoundErrorが発生する', () => {
    const nonExistentReportId = 'non-existent-report-123';
    const submissionTimestamp = new Date('2024-01-15T09:30:00Z');
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const submitterId = 'user-001';

    expect(() =>
      recordSubmissionTimestamp(
        nonExistentReportId,
        submissionTimestamp,
        reportDate,
        submitterId
      )
    ).toThrow(/報告ID/);
  });
});