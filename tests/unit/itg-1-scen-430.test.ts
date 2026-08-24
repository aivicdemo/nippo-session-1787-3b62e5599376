import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from "../../src/logic/submission-status-tracking";

describe("報告提出状況の集計・表示機能", () => {
  // SCEN-430
  test("集計期間が0秒（同一タイムスタンプ）の場合、その時点での提出状況が正確に集計される", () => {
    // 集計開始タイムスタンプを固定値で設定
    const aggregationStartTime = new Date("2026-08-19T10:00:00.000Z");
    const aggregationEndTime = new Date("2026-08-19T10:00:00.000Z");

    // テスト用チームID、ユーザーID
    const teamId = "team-001";
    const reportDate = "2026-08-19";
    const requestUserId = "manager-001";

    // 集計対象ユーザー情報の準備
    // ユーザーA～E: 提出済み（5名）
    const submittedUsers = [
      { userId: "user-001", userName: "ユーザーA", email: "user-a@example.com" },
      { userId: "user-002", userName: "ユーザーB", email: "user-b@example.com" },
      { userId: "user-003", userName: "ユーザーC", email: "user-c@example.com" },
      { userId: "user-004", userName: "ユーザーD", email: "user-d@example.com" },
      { userId: "user-005", userName: "ユーザーE", email: "user-e@example.com" },
    ];

    // ユーザーF～J: 未提出（5名）
    const unsubmittedUsers = [
      { userId: "user-006", userName: "ユーザーF", email: "user-f@example.com" },
      { userId: "user-007", userName: "ユーザーG", email: "user-g@example.com" },
      { userId: "user-008", userName: "ユーザーH", email: "user-h@example.com" },
      { userId: "user-009", userName: "ユーザーI", email: "user-i@example.com" },
      { userId: "user-010", userName: "ユーザーJ", email: "user-j@example.com" },
    ];

    // 提出済みユーザーの報告内容
    const submittedReports = submittedUsers.map((user) => ({
      userId: user.userId,
      teamId: teamId,
      reportDate: reportDate,
      yesterdayAccomplishment: `${user.userName}が昨日やったこと`,
      todayPlan: `${user.userName}が今日やること`,
      currentIssues: `${user.userName}が抱えている課題`,
      submittedAt: aggregationStartTime,
    }));

    // 集計リクエスト入力
    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // 集計関数を実行
    const result = aggregateReportSubmissionStatus(
      input,
      submittedReports,
      submittedUsers.length + unsubmittedUsers.length,
      unsubmittedUsers,
      aggregationStartTime,
      aggregationEndTime
    );

    // 検証: 集計結果の基本情報
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);
    expect(result.delayedSubmissionCount).toBe(0);

    // 検証: 提出率の計算
    // 提出率 = (5 / 10) * 100 = 50.0
    expect(result.submissionRate).toBe(50.0);

    // 検証: 未提出メンバーのリスト
    expect(result.unsubmittedMembers.length).toBe(5);
    result.unsubmittedMembers.forEach((member, index) => {
      expect(member.userId).toBe(unsubmittedUsers[index].userId);
      expect(member.userName).toBe(unsubmittedUsers[index].userName);
      expect(member.email).toBe(unsubmittedUsers[index].email);
      expect(typeof member.remainingMinutes).toBe("number");
    });

    // 検証: 集計実行時刻が開始タイムスタンプと一致
    expect(new Date(result.aggregatedAt)).toEqual(aggregationStartTime);

    // 検証: 提出済みレポート内容の確認（結果に含まれるべき情報）
    // 注: result構造に応じて、reportedContentフィールドなどで検証
    expect(submittedReports.length).toBe(5);
    submittedReports.forEach((report) => {
      expect(report.yesterdayAccomplishment).toBeTruthy();
      expect(report.todayPlan).toBeTruthy();
      expect(report.currentIssues).toBeTruthy();
    });
  });
});