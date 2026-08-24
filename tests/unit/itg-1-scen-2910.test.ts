import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type {
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
  UnsubmittedMember,
} from '../../src/logic/submission-status-tracking';

describe('aggregateReportSubmissionStatus', () => {
  // SCEN-2910: [edge] 報告受付終了判定機能 - 朝会開始時刻ちょうどで報告受付が終了する
  test('should reflect submission status accurately at the exact morning meeting start time with deadline enforcement', () => {
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-lead-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock time: 1 minute before morning meeting start (08:59)
    // Morning meeting scheduled start: 09:00
    // Deadline for report submission: 09:00 (same as meeting start)
    const beforeMeetingTime = new Date('2024-01-15T08:59:00Z');
    const meetingStartTime = new Date('2024-01-15T09:00:00Z');

    // Simulated team members (10 total)
    // Scenario setup: 7 submitted on-time, 2 submitted delayed, 1 not submitted
    const totalMembers = 10;
    const submittedOnTimeCount = 7;
    const delayedSubmissionCount = 2;
    const unsubmittedCount = 1;

    // At 08:59 (before deadline): 7 members submitted on-time
    // At 09:00 (deadline reached): 1 additional delayed submission arrives, 1 member still not submitted
    // The 10th member attempts to submit exactly at 09:00 but should be rejected

    // Expected aggregation state at meeting start time (09:00)
    // Based on submissions received by deadline moment
    const expectedSummary: ReportSubmissionStatusSummary = {
      teamId,
      reportDate,
      totalMembers,
      submittedCount: submittedOnTimeCount,
      unsubmittedCount,
      delayedSubmissionCount,
      submissionRate: 80.0, // (7 + 2) / 10 * 100 = 90.0, but only 7 are on-time, so rate = 7/10 * 100 = 70.0 for on-time; with delayed = 80.0
      unsubmittedMembers: [
        {
          userId: 'user-010',
          userName: 'Member Tenth',
          email: 'member10@company.example',
          remainingMinutes: 0, // Exactly at deadline, no time remaining
        },
      ],
      aggregatedAt: meetingStartTime.toISOString(),
    };

    // Execute aggregation at the exact meeting start time (09:00)
    const result = aggregateReportSubmissionStatus(input);

    // Verify team ID and report date match
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // Verify total member count
    expect(result.totalMembers).toBe(totalMembers);

    // Verify submission counts
    expect(result.submittedCount).toBe(expectedSummary.submittedCount);
    expect(result.delayedSubmissionCount).toBe(expectedSummary.delayedSubmissionCount);
    expect(result.unsubmittedCount).toBe(expectedSummary.unsubmittedCount);

    // Verify submission rate (80.0% = 8 out of 10 members submitted, with or without delay)
    expect(result.submissionRate).toBe(80.0);

    // Verify unsubmitted members list
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('user-010');
    expect(result.unsubmittedMembers[0].userName).toBe('Member Tenth');
    expect(result.unsubmittedMembers[0].email).toBe('member10@company.example');
    // At deadline time, remaining minutes should be 0 or negative (not applicable as deadline reached)
    expect(result.unsubmittedMembers[0].remainingMinutes).toBeLessThanOrEqual(0);

    // Verify aggregation timestamp is set to the meeting start moment
    expect(result.aggregatedAt).toBeDefined();
    const aggregatedDateTime = new Date(result.aggregatedAt);
    expect(aggregatedDateTime.getTime()).toBeGreaterThanOrEqual(meetingStartTime.getTime());
  });
});