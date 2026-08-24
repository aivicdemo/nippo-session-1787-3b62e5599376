import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary, UnsubmittedMember } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking', () => {
  // SCEN-1618
  test('should aggregate report submission status for multiple team members with correct submitted and unsubmitted counts', () => {
    const reportDate = '2026-08-19';
    const teamId = 'team-dev-001';
    const requestUserId = 'user-manager-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const unsubmittedMember1: UnsubmittedMember = {
      userId: 'user4',
      userName: 'Engineer D',
      email: 'user4@example.com',
      remainingMinutes: -45,
    };

    const unsubmittedMember2: UnsubmittedMember = {
      userId: 'user5',
      userName: 'Engineer E',
      email: 'user5@example.com',
      remainingMinutes: -45,
    };

    const expected: ReportSubmissionStatusSummary = {
      teamId,
      reportDate,
      totalMembers: 5,
      submittedCount: 3,
      unsubmittedCount: 2,
      delayedSubmissionCount: 0,
      submissionRate: 60.0,
      unsubmittedMembers: [unsubmittedMember1, unsubmittedMember2],
      aggregatedAt: '2026-08-19T10:00:00Z',
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(expected.teamId);
    expect(result.reportDate).toBe(expected.reportDate);
    expect(result.totalMembers).toBe(5);
    expect(result.submittedCount).toBe(3);
    expect(result.unsubmittedCount).toBe(2);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(60.0);
    expect(result.unsubmittedMembers).toHaveLength(2);
    expect(result.unsubmittedMembers[0].userId).toBe('user4');
    expect(result.unsubmittedMembers[0].userName).toBe('Engineer D');
    expect(result.unsubmittedMembers[0].email).toBe('user4@example.com');
    expect(result.unsubmittedMembers[1].userId).toBe('user5');
    expect(result.unsubmittedMembers[1].userName).toBe('Engineer E');
    expect(result.unsubmittedMembers[1].email).toBe('user5@example.com');
    expect(result.aggregatedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  });
});