import { recordSubmissionTimestamp } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信時刻記録', () => {
  test('SCEN-048: 日報送信時刻を記録し、期限との比較で遅延判定を実行して遅延フラグを確定する', () => {
    // Test inputs
    const reportId = 'REPORT-001';
    const submissionTimestamp = new Date('2026-08-19T08:45:00Z');
    const reportDate = new Date('2026-08-19');
    const submitterId = 'USER-001';

    // Execute
    const result = recordSubmissionTimestamp(
      reportId,
      submissionTimestamp,
      reportDate,
      submitterId
    );

    // Expected values from structured.formula
    const expectedDeadline = new Date('2026-08-19T09:00:00Z');
    const expectedMinutesBeforeDeadline = 15;
    const expectedIsDelayed = false;

    // Assertions
    expect(result.reportId).toBe('REPORT-001');
    expect(result.submissionTimestamp).toEqual(new Date('2026-08-19T08:45:00Z'));
    expect(result.deadline).toEqual(expectedDeadline);
    expect(result.isDelayed).toBe(expectedIsDelayed);
    expect(result.minutesBeforeDeadline).toBe(expectedMinutesBeforeDeadline);
  });
});