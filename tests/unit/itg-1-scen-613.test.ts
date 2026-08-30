import { validateReportInput } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-613: 修正を試みた日時が報告送信日時より前のときのエラーハンドリング
  test('修正日時が報告送信日時より前の場合、エラーをスロー', () => {
    const reportSubmissionTime = new Date('2025-01-15T08:00:00Z');
    const modificationAttemptTime = new Date('2025-01-15T07:55:00Z');
    const morningMeetingStartTime = '09:30';
    const modificationDeadlineMinutes = 30;

    expect(() =>
      validateReportInput(
        reportSubmissionTime,
        modificationAttemptTime,
        morningMeetingStartTime,
        modificationDeadlineMinutes
      )
    ).toThrow(/修正日時は報告送信日時以降である必要があります/);
  });
});