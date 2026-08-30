import { validateReportInput } from '../../src/logic/report-submission-management';

describe('Report Submission Management', () => {
  // SCEN-611
  test('should throw error when modificationDeadlineMinutes is negative value', () => {
    const reportSubmissionTime = new Date('2024-01-15T08:00:00Z');
    const modificationAttemptTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = '09:30';
    const modificationDeadlineMinutes = -1;

    expect(() =>
      validateReportInput(
        reportSubmissionTime,
        modificationAttemptTime,
        morningMeetingStartTime,
        modificationDeadlineMinutes,
      ),
    ).toThrow(/修正可能期間は1分以上で設定してください/);
  });
});