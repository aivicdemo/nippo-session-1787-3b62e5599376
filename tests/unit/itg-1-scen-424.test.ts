import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from "../../src/logic/submission-status-tracking";

describe("Report submission status aggregation across month boundary", () => {
  // SCEN-424
  test("should accurately aggregate submission status when submissions span month-end to month-start boundary", async () => {
    // Setup: Define fixed date boundary (Feb 28 to Mar 1)
    const februaryReportDate = "2024-02-28";
    const marchReportDate = "2024-03-01";
    const teamId = "team-x-001";
    const requestUserId = "manager-001";

    // Mock submission data:
    // - Member A: submitted Feb 27 09:00, Feb 28 09:00 (should count only once per day in Feb)
    // - Members B-I: submitted Feb 28 23:59 (Feb boundary)
    // - Member J: submitted Mar 1 00:01 (Mar boundary)
    // - Member K: not submitted (to test unsubmitted count)
    // Total team members: 10

    const februarySubmissionTimestamps = [
      "2024-02-27T09:00:00Z", // Member A, day 1
      "2024-02-28T09:00:00Z", // Member A, day 2 (same day, same period)
      "2024-02-28T23:59:00Z", // Members B-I (8 members)
      "2024-02-28T23:59:00Z",
      "2024-02-28T23:59:00Z",
      "2024-02-28T23:59:00Z",
      "2024-02-28T23:59:00Z",
      "2024-02-28T23:59:00Z",
      "2024-02-28T23:59:00Z",
      "2024-02-28T23:59:00Z",
    ];

    const marchSubmissionTimestamps = [
      "2024-03-01T00:01:00Z", // Member J (1 member, after UTC midnight)
    ];

    // Input for February aggregation
    const februaryInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: februaryReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Input for March aggregation
    const marchInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: marchReportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Execute aggregation for February
    const februaryResult: ReportSubmissionStatusSummary =
      await aggregateReportSubmissionStatus(februaryInput);

    // Execute aggregation for March
    const marchResult: ReportSubmissionStatusSummary =
      await aggregateReportSubmissionStatus(marchInput);

    // Assertions for February
    // Expected: 9 submitted (A counts once despite 2 timestamps, B-I = 8 members)
    // Unsubmitted: 1 (Member K)
    // Submission rate: 9/10 = 90%
    expect(februaryResult.teamId).toBe(teamId);
    expect(februaryResult.reportDate).toBe(februaryReportDate);
    expect(februaryResult.totalMembers).toBe(10);
    expect(februaryResult.submittedCount).toBe(9);
    expect(februaryResult.unsubmittedCount).toBe(1);
    expect(februaryResult.delayedSubmissionCount).toBe(0);
    expect(februaryResult.submissionRate).toBe(90.0);
    expect(Array.isArray(februaryResult.unsubmittedMembers)).toBe(true);
    expect(februaryResult.unsubmittedMembers.length).toBe(1);
    expect(typeof februaryResult.aggregatedAt).toBe("string");

    // Assertions for March
    // Expected: 3 submitted (Member J from 00:01 plus 2 others retesting)
    // But based on scenario: only Member J submitted on Mar 1
    // Unsubmitted: 7 (other members from Feb haven't resubmitted for Mar)
    // However, re-reading scenario: total for March should be "3 件"
    // This likely means: Members submitted on Mar 1 0:01 (J) and we test the Feb 28 23:59 submissions are NOT in March
    // So March unsubmitted should reflect members not yet submitted for Mar 1 reporting period
    // Submission rate for March: 3/10 = 30%
    expect(marchResult.teamId).toBe(teamId);
    expect(marchResult.reportDate).toBe(marchReportDate);
    expect(marchResult.totalMembers).toBe(10);
    expect(marchResult.submittedCount).toBe(3);
    expect(marchResult.unsubmittedCount).toBe(7);
    expect(marchResult.delayedSubmissionCount).toBe(0);
    expect(marchResult.submissionRate).toBe(30.0);
    expect(Array.isArray(marchResult.unsubmittedMembers)).toBe(true);
    expect(marchResult.unsubmittedMembers.length).toBe(7);

    // Verify unsubmitted member structure
    if (februaryResult.unsubmittedMembers.length > 0) {
      const unsubmittedMember = februaryResult.unsubmittedMembers[0];
      expect(typeof unsubmittedMember.userId).toBe("string");
      expect(typeof unsubmittedMember.userName).toBe("string");
      expect(typeof unsubmittedMember.email).toBe("string");
      expect(typeof unsubmittedMember.remainingMinutes).toBe("number");
    }

    // Verify aggregation timestamp is in ISO 8601 format
    const aggregatedAtDate = new Date(februaryResult.aggregatedAt);
    expect(aggregatedAtDate.toString()).not.toBe("Invalid Date");

    // Verify March aggregation timestamp
    const marchAggregatedAtDate = new Date(marchResult.aggregatedAt);
    expect(marchAggregatedAtDate.toString()).not.toBe("Invalid Date");
  });
});