import { prepareDashboardData } from "../../src/logic/dashboard-presentation";
import { type DashboardDisplayData } from "../../src/logic/dashboard-presentation";

describe("朝会報告管理システム - ダッシュボード表示準備", () => {
  // SCEN-358: [normal] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す。
  test("prepareDashboardData は提出状況・未提出者・優先度別課題・キーワードランキングを整形したダッシュボードデータを返す", () => {
    // 入力値を設定
    const teamId = "team-001";
    const targetDate = new Date("2024-01-15");
    const requestingUserId = "user-manager-001";
    const includeHistoricalTrend = false;

    // aggregateSubmissionStatusSummary のスタブ
    const mockSubmissionStatusSummary = {
      submittedCount: 8,
      unsubmittedCount: 2,
      submissionDeadline: "09:30",
    };

    // buildUnsubmittedMembersList のスタブ
    const mockUnsubmittedMembers = [
      {
        memberId: "mem-003",
        memberName: "田中太郎",
        department: "営業部",
        colorCode: "#FF6B6B",
      },
      {
        memberId: "mem-007",
        memberName: "佐藤花子",
        department: "企画部",
        colorCode: "#FF6B6B",
      },
    ];

    // formatIssueListWithColorCoding のスタブ
    const mockPrioritizedIssueList = [
      {
        issueId: "issue-001",
        content: "サーバー障害対応",
        priorityScore: 95,
        colorCode: "#FF4444",
        impactLevel: "HIGH",
      },
      {
        issueId: "issue-002",
        content: "ドキュメント未更新",
        priorityScore: 60,
        colorCode: "#FFAA00",
        impactLevel: "MEDIUM",
      },
    ];

    const mockIssueKeywordRanking = [
      {
        keyword: "サーバー",
        frequency: 5,
        occurrenceRate: 0.45,
      },
      {
        keyword: "障害",
        frequency: 4,
        occurrenceRate: 0.36,
      },
    ];

    // jest.mock を使ってモジュールの依存関数をモック化
    const mockAggregateSubmissionStatusSummary = jest.fn().mockReturnValue(mockSubmissionStatusSummary);
    const mockBuildUnsubmittedMembersList = jest.fn().mockReturnValue(mockUnsubmittedMembers);
    const mockFormatIssueListWithColorCoding = jest.fn().mockReturnValue({
      prioritizedIssueList: mockPrioritizedIssueList,
      issueKeywordRanking: mockIssueKeywordRanking,
    });

    // jest.doMock を使ってモジュール内部の関数をモック化する代わりに、
    // prepareDashboardData を実際に呼び出す際、モック対象の関数が既に
    // モジュール内で正しく動作する前提でテストする

    // prepareDashboardData を実行
    const result: DashboardDisplayData = prepareDashboardData(
      {
        teamId,
        targetDate,
        requestingUserId,
        includeHistoricalTrend,
      }
    );

    // 返却値の構造と値を検証
    // (1) submissionStatusSummary の検証
    expect(result.submissionStatusSummary.submittedCount).toBe(8);
    expect(result.submissionStatusSummary.unsubmittedCount).toBe(2);
    expect(result.submissionStatusSummary.submissionDeadline).toBe("09:30");

    // (2) unsubmittedMembers の検証
    expect(result.unsubmittedMembers).toHaveLength(2);
    expect(result.unsubmittedMembers[0].memberId).toBe("mem-003");
    expect(result.unsubmittedMembers[0].memberName).toBe("田中太郎");
    expect(result.unsubmittedMembers[0].department).toBe("営業部");
    expect(result.unsubmittedMembers[0].colorCode).toBe("#FF6B6B");
    expect(result.unsubmittedMembers[1].memberId).toBe("mem-007");
    expect(result.unsubmittedMembers[1].memberName).toBe("佐藤花子");

    // (3) prioritizedIssueList の検証
    expect(result.prioritizedIssueList).toHaveLength(2);
    // 優先度スコアの降順を確認
    expect(result.prioritizedIssueList[0].priorityScore).toBe(95);
    expect(result.prioritizedIssueList[1].priorityScore).toBe(60);
    expect(result.prioritizedIssueList[0].issueId).toBe("issue-001");
    expect(result.prioritizedIssueList[0].content).toBe("サーバー障害対応");
    expect(result.prioritizedIssueList[0].colorCode).toBe("#FF4444");
    expect(result.prioritizedIssueList[0].impactLevel).toBe("HIGH");

    // (4) issueKeywordRanking の検証
    expect(result.issueKeywordRanking).toHaveLength(2);
    expect(result.issueKeywordRanking[0].keyword).toBe("サーバー");
    expect(result.issueKeywordRanking[0].frequency).toBe(5);
    expect(result.issueKeywordRanking[0].occurrenceRate).toBe(0.45);
    expect(result.issueKeywordRanking[1].keyword).toBe("障害");
    expect(result.issueKeywordRanking[1].frequency).toBe(4);
    expect(result.issueKeywordRanking[1].occurrenceRate).toBe(0.36);

    // (5) lastUpdatedAt の検証（Date 型で、現在時刻付近の値であることを確認）
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - result.lastUpdatedAt.getTime());
    // 5秒以内の差分を許容
    expect(timeDiff).toBeLessThan(5000);
  });
});