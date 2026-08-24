import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from "../../src/logic/submission-status-tracking";

describe("部長向けダッシュボード報告提出状況のリアルタイム表示", () => {
  // SCEN-087: [normal] 報告提出状況のリアルタイム集計・表示機能
  // 全チームメンバー10名の報告送信完了時に提出済み10名・未提出0名が部長ダッシュボードに表示される
  test("チームメンバー全10名が報告送信完了した時点で、提出済み10名・未提出0名がダッシュボードにリアルタイム表示される", () => {
    // Arrange: テストデータの準備
    const teamId = "team-engineering-001";
    const reportDate = "2024-01-15";
    const requestUserId = "user-director-001";
    const currentTime = new Date("2024-01-15T09:00:00Z");

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 期限内に提出したメンバーの提出データ（10名分）
    const submittedMembers = [
      {
        userId: "user-eng-001",
        userName: "エンジニア太郎",
        email: "taro@example.com",
        submissionTimestamp: new Date("2024-01-15T08:15:00Z"),
      },
      {
        userId: "user-eng-002",
        userName: "エンジニア花子",
        email: "hanako@example.com",
        submissionTimestamp: new Date("2024-01-15T08:20:00Z"),
      },
      {
        userId: "user-eng-003",
        userName: "エンジニア次郎",
        email: "jiro@example.com",
        submissionTimestamp: new Date("2024-01-15T08:22:00Z"),
      },
      {
        userId: "user-eng-004",
        userName: "エンジニア由美",
        email: "yumi@example.com",
        submissionTimestamp: new Date("2024-01-15T08:25:00Z"),
      },
      {
        userId: "user-eng-005",
        userName: "エンジニア健太",
        email: "kenta@example.com",
        submissionTimestamp: new Date("2024-01-15T08:28:00Z"),
      },
      {
        userId: "user-eng-006",
        userName: "エンジニア美咲",
        email: "misaki@example.com",
        submissionTimestamp: new Date("2024-01-15T08:30:00Z"),
      },
      {
        userId: "user-eng-007",
        userName: "エンジニア隆一",
        email: "ryuichi@example.com",
        submissionTimestamp: new Date("2024-01-15T08:32:00Z"),
      },
      {
        userId: "user-eng-008",
        userName: "エンジニア恵子",
        email: "keiko@example.com",
        submissionTimestamp: new Date("2024-01-15T08:35:00Z"),
      },
      {
        userId: "user-eng-009",
        userName: "エンジニア拓也",
        email: "takuya@example.com",
        submissionTimestamp: new Date("2024-01-15T08:38:00Z"),
      },
      {
        userId: "user-eng-010",
        userName: "エンジニア真理子",
        email: "mariko@example.com",
        submissionTimestamp: new Date("2024-01-15T08:40:00Z"),
      },
    ];

    // ビジネスルールに基づく計算値の準備
    // 期限時刻：朝9時（09:00）
    const reportDeadlineTime = new Date("2024-01-15T09:00:00Z");
    const totalMembers = 10;
    const submittedCount = 10; // 全員が期限内に提出
    const unsubmittedCount = 0; // 未提出者なし
    const delayedSubmissionCount = 0; // 期限超過での提出もなし
    const submissionRate = 100.0; // (10 / 10) * 100 = 100.0%

    // Act: 関数を呼び出す
    // 注: aggregateReportSubmissionStatus は実装済みのリポジトリから
    // 提出済みメンバーのリストと集計用の詳細情報を取得して集計を実行
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      input,
      {
        submittedMembers,
        totalTeamMembers: totalMembers,
        reportDeadlineTime,
        unsubmittedMembers: [], // 未提出者がいないため空配列
      }
    );

    // Assert: 期待値の検証
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(submissionRate);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.aggregatedAt).toBeDefined();
    // aggregatedAtはISO 8601形式であることを確認
    expect(typeof result.aggregatedAt).toBe("string");
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});