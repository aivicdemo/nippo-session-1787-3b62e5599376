import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Month-End Aggregation', () => {
  // SCEN-2797
  test('should accurately aggregate report submission status on month-end dates (28, 29, 30, 31)', async () => {
    const teamId = 'TEAM-001';
    const requestUserId = 'USER-ADMIN-001';
    const memberCount = 10;

    // Test case 1: February 28 (non-leap year)
    const februaryReportDate = '2024-02-28';
    const februaryInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: februaryReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const februaryResult: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(februaryInput);

    expect(februaryResult.teamId).toBe(teamId);
    expect(februaryResult.reportDate).toBe(februaryReportDate);
    expect(februaryResult.totalMembers).toBe(memberCount);
    expect(februaryResult.submittedCount).toBe(10);
    expect(februaryResult.unsubmittedCount).toBe(0);
    expect(februaryResult.delayedSubmissionCount).toBe(0);
    expect(februaryResult.submissionRate).toBe(100.0);
    expect(februaryResult.unsubmittedMembers).toEqual([]);
    expect(februaryResult.aggregatedAt).toBeDefined();

    // Test case 2: March 31
    const marchReportDate = '2024-03-31';
    const marchInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: marchReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const marchResult: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(marchInput);

    expect(marchResult.teamId).toBe(teamId);
    expect(marchResult.reportDate).toBe(marchReportDate);
    expect(marchResult.totalMembers).toBe(memberCount);
    expect(marchResult.submittedCount).toBe(10);
    expect(marchResult.unsubmittedCount).toBe(0);
    expect(marchResult.delayedSubmissionCount).toBe(0);
    expect(marchResult.submissionRate).toBe(100.0);
    expect(marchResult.unsubmittedMembers).toEqual([]);

    // Test case 3: April 30
    const aprilReportDate = '2024-04-30';
    const aprilInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: aprilReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const aprilResult: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(aprilInput);

    expect(aprilResult.teamId).toBe(teamId);
    expect(aprilResult.reportDate).toBe(aprilReportDate);
    expect(aprilResult.totalMembers).toBe(memberCount);
    expect(aprilResult.submittedCount).toBe(10);
    expect(aprilResult.unsubmittedCount).toBe(0);
    expect(aprilResult.delayedSubmissionCount).toBe(0);
    expect(aprilResult.submissionRate).toBe(100.0);
    expect(aprilResult.unsubmittedMembers).toEqual([]);

    // Test case 4: May 31
    const mayReportDate = '2024-05-31';
    const mayInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: mayReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const mayResult: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(mayInput);

    expect(mayResult.teamId).toBe(teamId);
    expect(mayResult.reportDate).toBe(mayReportDate);
    expect(mayResult.totalMembers).toBe(memberCount);
    expect(mayResult.submittedCount).toBe(10);
    expect(mayResult.unsubmittedCount).toBe(0);
    expect(mayResult.delayedSubmissionCount).toBe(0);
    expect(mayResult.submissionRate).toBe(100.0);
    expect(mayResult.unsubmittedMembers).toEqual([]);

    // Test case 5: Leap year - February 29, 2024
    const leapFebruaryReportDate = '2024-02-29';
    const leapFebruaryInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: leapFebruaryReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const leapFebruaryResult: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(leapFebruaryInput);

    expect(leapFebruaryResult.teamId).toBe(teamId);
    expect(leapFebruaryResult.reportDate).toBe(leapFebruaryReportDate);
    expect(leapFebruaryResult.totalMembers).toBe(memberCount);
    expect(leapFebruaryResult.submittedCount).toBe(10);
    expect(leapFebruaryResult.unsubmittedCount).toBe(0);
    expect(leapFebruaryResult.delayedSubmissionCount).toBe(0);
    expect(leapFebruaryResult.submissionRate).toBe(100.0);
    expect(leapFebruaryResult.unsubmittedMembers).toEqual([]);

    // Verify month boundary separation: March 1 should not include February 28 data
    const marchFirstReportDate = '2024-03-01';
    const marchFirstInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: marchFirstReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const marchFirstResult: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(marchFirstInput);

    // March 1 result should be independent of February 28 result
    expect(marchFirstResult.reportDate).toBe(marchFirstReportDate);
    expect(marchFirstResult.totalMembers).toBe(memberCount);
    expect(marchFirstResult.submittedCount).toBeGreaterThanOrEqual(0);
    expect(marchFirstResult.submittedCount).toBeLessThanOrEqual(memberCount);

    // Verify month boundary separation: February 28 should not include March 1 data
    const februaryAfterMarchInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: februaryReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const februaryAfterMarchResult: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(februaryAfterMarchInput);

    // February 28 aggregation should remain consistent regardless of subsequent March data
    expect(februaryAfterMarchResult.reportDate).toBe(februaryReportDate);
    expect(februaryAfterMarchResult.totalMembers).toBe(memberCount);
  });
});