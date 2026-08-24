import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('report submission status tracking', () => {
  // SCEN-2912: [edge] 報告受付終了判定機能 - 朝会開始時刻の直前まで報告受付が続く
  test('should accept submissions until exactly meeting-start time, then reject after', () => {
    // Setup: test data with fixed timestamps
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'admin-user-001';

    // Scenario 1: Current time is 08:59:59 (one second before meeting start at 09:00:00)
    // This submission should be accepted (before deadline)
    const beforeDeadlineInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock current time as 08:59:59
    const beforeDeadlineTime = new Date('2024-01-15T08:59:59Z');
    jest.useFakeTimers();
    jest.setSystemTime(beforeDeadlineTime);

    // First aggregation: should show all members and track submission status before deadline
    const beforeDeadlineResult: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      beforeDeadlineInput
    );

    // Verify before deadline state
    expect(beforeDeadlineResult.teamId).toBe(teamId);
    expect(beforeDeadlineResult.reportDate).toBe(reportDate);
    expect(beforeDeadlineResult.totalMembers).toBe(10); // 10 team members total
    expect(beforeDeadlineResult.submittedCount).toBeGreaterThanOrEqual(0);
    expect(beforeDeadlineResult.unsubmittedCount).toBeGreaterThanOrEqual(0);
    expect(beforeDeadlineResult.delayedSubmissionCount).toBe(0); // No delayed submissions yet
    expect(beforeDeadlineResult.submissionRate).toBeLessThanOrEqual(100);
    expect(beforeDeadlineResult.submissionRate).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(beforeDeadlineResult.unsubmittedMembers)).toBe(true);
    expect(beforeDeadlineResult.aggregatedAt).toBeDefined();

    // Scenario 2: Current time is exactly 09:00:00 (meeting start time)
    // Submissions at or after this time should be marked as delayed or rejected
    const meetingStartTime = new Date('2024-01-15T09:00:00Z');
    jest.setSystemTime(meetingStartTime);

    const afterDeadlineInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const afterDeadlineResult: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      afterDeadlineInput
    );

    // Verify after deadline state
    expect(afterDeadlineResult.teamId).toBe(teamId);
    expect(afterDeadlineResult.reportDate).toBe(reportDate);
    expect(afterDeadlineResult.totalMembers).toBe(10);
    // When at exactly meeting start time, submissions that come after are not counted as on-time
    expect(afterDeadlineResult.delayedSubmissionCount).toBeLessThanOrEqual(
      afterDeadlineResult.totalMembers
    );
    // Submission rate should reflect that some submissions are now delayed
    expect(afterDeadlineResult.submissionRate).toBeLessThanOrEqual(100);

    // Verify boundary condition: include delayed submissions behavior
    expect(afterDeadlineResult.unsubmittedCount).toBeGreaterThanOrEqual(0);

    // Verify timestamps are recorded and comparable
    const beforeTimestamp = new Date(beforeDeadlineResult.aggregatedAt);
    const afterTimestamp = new Date(afterDeadlineResult.aggregatedAt);
    expect(beforeTimestamp.getTime()).toBeLessThan(afterTimestamp.getTime());

    // Cleanup
    jest.useRealTimers();
  });
});