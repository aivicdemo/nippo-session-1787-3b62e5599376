import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Real-time Dashboard Display', () => {
  // SCEN-1023
  test('should display real-time report submission status for all team members on managers dashboard', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(4);
    expect(result.unsubmittedCount).toBe(6);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(40.0);
    expect(result.unsubmittedMembers).toHaveLength(6);

    const unsubmittedUserIds = result.unsubmittedMembers.map((member) => member.userId).sort();
    expect(unsubmittedUserIds).toEqual(['user-001', 'user-003', 'user-004', 'user-006', 'user-008', 'user-009'].sort());

    const submittedMembers = ['user-002', 'user-005', 'user-007', 'user-010'];
    result.unsubmittedMembers.forEach((unsubmittedMember) => {
      expect(submittedMembers).not.toContain(unsubmittedMember.userId);
      expect(unsubmittedMember.userName).toBeDefined();
      expect(unsubmittedMember.email).toBeDefined();
      expect(typeof unsubmittedMember.remainingMinutes).toBe('number');
    });

    expect(result.aggregatedAt).toBeDefined();
    const aggregatedTime = new Date(result.aggregatedAt);
    expect(aggregatedTime.getTime()).toBeGreaterThan(0);
  });
});