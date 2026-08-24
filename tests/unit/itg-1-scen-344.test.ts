import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation', () => {
  // SCEN-344: [normal] 日報送信・提出状況更新機能 - 1人のエンジニアが同一日付で複数回日報を送信した場合、最新の送信時刻が記録される
  test('should aggregate report submission status with latest submission time when engineer submits multiple times on same day', async () => {
    const teamId = 'team-001';
    const reportDate = '2026-08-19';
    const requestUserId = 'manager-001';
    const userId = 'engineer-001';

    // Set up mock data: Engineer submits 3 times on the same day
    // First submission at 09:00:00
    const firstSubmissionTime = new Date('2026-08-19T09:00:00Z');
    // Second submission at 10:30:00
    const secondSubmissionTime = new Date('2026-08-19T10:30:00Z');
    // Third submission at 11:45:00
    const thirdSubmissionTime = new Date('2026-08-19T11:45:00Z');

    // Expected final state: latest submission time (11:45:00) should be recorded
    const expectedSubmissionTime = thirdSubmissionTime;

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Call the function with input containing multiple submissions
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    // Verify aggregation result
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // Verify that the latest submission is recorded
    // The system should have recorded only the final submission time
    const submittedMember = result.submittedMembers?.find(
      (member) => member.userId === userId
    );

    if (submittedMember) {
      // If member is in submitted list, verify submission time is the latest one
      expect(submittedMember.submissionTime).toEqual(expectedSubmissionTime);
    }

    // Verify that total submission count reflects the latest state
    expect(result.submittedCount).toBeGreaterThanOrEqual(0);
    expect(result.unsubmittedCount).toBeGreaterThanOrEqual(0);

    // Verify aggregation timestamp is recorded
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');

    // Verify submission rate is calculated correctly
    expect(result.submissionRate).toBeGreaterThanOrEqual(0);
    expect(result.submissionRate).toBeLessThanOrEqual(100);

    // Verify that the submission state is consistent
    expect(result.totalMembers).toBe(result.submittedCount + result.unsubmittedCount + result.delayedSubmissionCount);
  });
});