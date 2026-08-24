import { describe, test, expect, beforeEach } from "@jest/globals";
import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import type {
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
} from "../../src/logic/submission-status-tracking";

describe("Report Submission Status Aggregation", () => {
  // SCEN-2963
  test("aggregates submission status with zero submitted members and all members unsubmitted", () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      requestUserId: "user-manager-001",
      includeDelayedSubmissions: true,
    };

    const unsubmittedMembers = [
      {
        userId: "user-001",
        userName: "Engineer A",
        email: "engineer-a@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-002",
        userName: "Engineer B",
        email: "engineer-b@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-003",
        userName: "Engineer C",
        email: "engineer-c@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-004",
        userName: "Engineer D",
        email: "engineer-d@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-005",
        userName: "Engineer E",
        email: "engineer-e@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-006",
        userName: "Engineer F",
        email: "engineer-f@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-007",
        userName: "Engineer G",
        email: "engineer-g@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-008",
        userName: "Engineer H",
        email: "engineer-h@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-009",
        userName: "Engineer I",
        email: "engineer-i@example.com",
        remainingMinutes: 45,
      },
      {
        userId: "user-010",
        userName: "Engineer J",
        email: "engineer-j@example.com",
        remainingMinutes: 45,
      },
    ];

    const result: ReportSubmissionStatusSummary =
      aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe("team-001");
    expect(result.reportDate).toBe("2024-01-15");
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(0);
    expect(result.unsubmittedCount).toBe(10);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(0.0);
    expect(result.unsubmittedMembers).toHaveLength(10);
    expect(result.unsubmittedMembers[0]).toMatchObject({
      userId: expect.any(String),
      userName: expect.any(String),
      email: expect.any(String),
      remainingMinutes: expect.any(Number),
    });
    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});