import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from "../../src/logic/submission-status-tracking";

describe("報告提出状況の集計機能", () => {
  // SCEN-345
  test("同じ入力で2回実行しても同じ送信時刻と提出状況が記録される", () => {
    const teamId = "team-001";
    const reportDate = "2024-01-15";
    const requestUserId = "user-dept-head-001";
    const baseTimestamp = new Date("2024-01-15T09:30:00Z");

    // 1回目の集計実行
    const input1: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result1 = aggregateReportSubmissionStatus(input1);

    // 1回目の結果を検証
    expect(result1.teamId).toBe(teamId);
    expect(result1.reportDate).toBe(reportDate);
    expect(result1.totalMembers).toBe(10);
    expect(result1.submittedCount).toBe(8);
    expect(result1.unsubmittedCount).toBe(2);
    expect(result1.delayedSubmissionCount).toBe(0);
    expect(result1.submissionRate).toBe(80.0);
    expect(result1.unsubmittedMembers).toHaveLength(2);
    expect(result1.unsubmittedMembers[0]).toEqual({
      userId: "user-eng-009",
      userName: "田中太郎",
      email: "tanaka.taro@company.com",
      remainingMinutes: 45,
    });
    expect(result1.unsubmittedMembers[1]).toEqual({
      userId: "user-eng-010",
      userName: "鈴木花子",
      email: "suzuki.hanako@company.com",
      remainingMinutes: 45,
    });
    const aggregatedAt1 = result1.aggregatedAt;

    // 2回目の集計実行（同じ入力）
    const input2: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result2 = aggregateReportSubmissionStatus(input2);

    // 2回目の結果を検証
    expect(result2.teamId).toBe(teamId);
    expect(result2.reportDate).toBe(reportDate);
    expect(result2.totalMembers).toBe(10);
    expect(result2.submittedCount).toBe(8);
    expect(result2.unsubmittedCount).toBe(2);
    expect(result2.delayedSubmissionCount).toBe(0);
    expect(result2.submissionRate).toBe(80.0);
    expect(result2.unsubmittedMembers).toHaveLength(2);

    // 1回目と2回目の結果が同一であることを確認
    expect(result2.aggregatedAt).toBe(aggregatedAt1);
    expect(result2.unsubmittedMembers[0]).toEqual(result1.unsubmittedMembers[0]);
    expect(result2.unsubmittedMembers[1]).toEqual(result1.unsubmittedMembers[1]);

    // 提出状況が一致していることを確認
    expect(result2.submittedCount).toBe(result1.submittedCount);
    expect(result2.unsubmittedCount).toBe(result1.unsubmittedCount);
    expect(result2.delayedSubmissionCount).toBe(result1.delayedSubmissionCount);
    expect(result2.submissionRate).toBe(result1.submissionRate);
  });
});