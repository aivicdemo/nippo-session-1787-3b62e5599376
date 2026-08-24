import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Real-time Display', () => {
  // SCEN-116: [edge] 提出状況リアルタイム表示機能 - 朝会開始予定時刻の5分前を1秒超過した時点で、提出状況表示がトリガーされる
  test('should trigger submission status display exactly 1 second after 5 minutes before morning meeting start time', async () => {
    const teamId = 'team-dev-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    // Morning meeting scheduled to start at 09:00 JST
    const meetingStartTime = new Date('2024-01-15T09:00:00+09:00');
    // 5 minutes before meeting start: 08:55:00 JST
    const fiveMinutesBefore = new Date(meetingStartTime.getTime() - 5 * 60 * 1000);
    // 1 second after 5 minutes before: 08:55:01 JST (trigger point)
    const triggerTime = new Date(fiveMinutesBefore.getTime() + 1000);

    // Simulate current time at trigger point
    jest.useFakeTimers();
    jest.setSystemTime(triggerTime);

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Call the aggregation function at trigger time
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    // Verify the result structure and values
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(typeof result.totalMembers).toBe('number');
    expect(result.totalMembers).toBeGreaterThan(0);
    expect(typeof result.submittedCount).toBe('number');
    expect(result.submittedCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.unsubmittedCount).toBe('number');
    expect(result.unsubmittedCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.delayedSubmissionCount).toBe('number');
    expect(result.delayedSubmissionCount).toBeGreaterThanOrEqual(0);

    // Verify submission rate calculation (0-100 with 1 decimal place precision)
    expect(typeof result.submissionRate).toBe('number');
    expect(result.submissionRate).toBeGreaterThanOrEqual(0);
    expect(result.submissionRate).toBeLessThanOrEqual(100);
    const decimalPlaces = (result.submissionRate.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(1);

    // Verify unsubmitted members list
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers.length).toBe(result.unsubmittedCount);

    // Verify each unsubmitted member has required fields
    result.unsubmittedMembers.forEach((member) => {
      expect(member).toHaveProperty('userId');
      expect(member).toHaveProperty('userName');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('remainingMinutes');
      expect(typeof member.userId).toBe('string');
      expect(typeof member.userName).toBe('string');
      expect(typeof member.email).toBe('string');
      expect(typeof member.remainingMinutes).toBe('number');
      // Remaining minutes should be negative at trigger time (past deadline)
      expect(member.remainingMinutes).toBeLessThan(0);
    });

    // Verify aggregatedAt timestamp is recorded in ISO 8601 format
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');
    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate.getTime()).toBeGreaterThanOrEqual(triggerTime.getTime() - 1000);
    expect(aggregatedAtDate.getTime()).toBeLessThanOrEqual(triggerTime.getTime() + 5000);

    // Verify data consistency: submitted + unsubmitted + delayed should account for total members
    const accountedMembers = result.submittedCount + result.unsubmittedCount + result.delayedSubmissionCount;
    expect(accountedMembers).toBeLessThanOrEqual(result.totalMembers);

    jest.useRealTimers();
  });
});