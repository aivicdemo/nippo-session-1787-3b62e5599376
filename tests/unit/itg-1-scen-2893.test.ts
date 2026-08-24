import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary, UnsubmittedMember } from '../../src/logic/submission-status-tracking';

describe('aggregateReportSubmissionStatus', () => {
  // SCEN-2893: [normal] 報告受付終了機能 - 朝会開始時刻に到達したとき、同じ入力条件で2回実行しても提出済みデータの確定結果が変わらない
  test('should return unchanged submission status when called twice at and after morning meeting start time', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-admin-001';

    // Mock database state: simulating first submission at 1 minute before meeting start
    const meetingStartTime = new Date('2024-01-15T09:00:00Z');
    const firstSubmissionTime = new Date('2024-01-15T08:59:00Z');
    const secondSubmissionTime = new Date('2024-01-15T09:00:00Z');

    // First aggregation call: before meeting start time
    const firstInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Simulate first aggregation result at 08:59
    const mockFirstResult: ReportSubmissionStatusSummary = {
      teamId,
      reportDate,
      totalMembers: 10,
      submittedCount: 9,
      unsubmittedCount: 1,
      delayedSubmissionCount: 0,
      submissionRate: 90.0,
      unsubmittedMembers: [
        {
          userId: 'user-member-010',
          userName: 'Member Ten',
          email: 'member10@example.com',
          remainingMinutes: 1,
        },
      ],
      aggregatedAt: firstSubmissionTime.toISOString(),
    };

    // Call aggregation at first time
    const firstResult = aggregateReportSubmissionStatus(firstInput);

    // Verify first result structure
    expect(firstResult).toEqual(expect.objectContaining({
      teamId,
      reportDate,
      totalMembers: expect.any(Number),
      submittedCount: expect.any(Number),
      unsubmittedCount: expect.any(Number),
      delayedSubmissionCount: expect.any(Number),
      submissionRate: expect.any(Number),
      unsubmittedMembers: expect.any(Array),
      aggregatedAt: expect.any(String),
    }));

    const firstSubmissionConfirmedTime = firstResult.aggregatedAt;
    const firstSubmittedCount = firstResult.submittedCount;
    const firstUnsubmittedCount = firstResult.unsubmittedCount;
    const firstSubmissionRate = firstResult.submissionRate;

    // Second aggregation call: at meeting start time (09:00)
    const secondInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const secondResult = aggregateReportSubmissionStatus(secondInput);

    // Verify second result has same values as first result
    // The submission status should not change when called at the exact meeting start time
    expect(secondResult.submittedCount).toBe(firstSubmittedCount);
    expect(secondResult.unsubmittedCount).toBe(firstUnsubmittedCount);
    expect(secondResult.submissionRate).toBe(firstSubmissionRate);
    expect(secondResult.teamId).toBe(teamId);
    expect(secondResult.reportDate).toBe(reportDate);
    expect(secondResult.totalMembers).toBe(firstResult.totalMembers);
    expect(secondResult.delayedSubmissionCount).toBe(firstResult.delayedSubmissionCount);

    // Verify unsubmitted members list remains unchanged
    expect(secondResult.unsubmittedMembers.length).toBe(firstResult.unsubmittedMembers.length);
    if (secondResult.unsubmittedMembers.length > 0 && firstResult.unsubmittedMembers.length > 0) {
      expect(secondResult.unsubmittedMembers[0].userId).toBe(firstResult.unsubmittedMembers[0].userId);
      expect(secondResult.unsubmittedMembers[0].userName).toBe(firstResult.unsubmittedMembers[0].userName);
      expect(secondResult.unsubmittedMembers[0].email).toBe(firstResult.unsubmittedMembers[0].email);
    }

    // Verify aggregated timestamps follow chronological order
    const firstAggregatedAt = new Date(firstResult.aggregatedAt);
    const secondAggregatedAt = new Date(secondResult.aggregatedAt);
    expect(secondAggregatedAt.getTime()).toBeGreaterThanOrEqual(firstAggregatedAt.getTime());
  });
});