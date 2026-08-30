import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出と優先度付け", () => {
  test("SCEN-218: 信頼度スコアが30未満のキーワードを除外し、30以上のものだけをランク付けして返す", () => {
    // テスト用の日報データセット（10件）を準備
    const reports = [
      {
        reportId: "report-001",
        reportDate: new Date("2024-01-15T09:00:00Z"),
        issueText: "微妙な遅延が発生しており、バグの修正に時間がかかっています",
        teamId: "team-001"
      },
      {
        reportId: "report-002",
        reportDate: new Date("2024-01-15T09:05:00Z"),
        issueText: "バグが見つかり、若干のリソース問題が発生しています",
        teamId: "team-001"
      },
      {
        reportId: "report-003",
        reportDate: new Date("2024-01-15T09:10:00Z"),
        issueText: "依存関係の問題でバグが増加しています",
        teamId: "team-002"
      },
      {
        reportId: "report-004",
        reportDate: new Date("2024-01-15T09:15:00Z"),
        issueText: "バグ修正中、微妙な遅延が続いています",
        teamId: "team-002"
      },
      {
        reportId: "report-005",
        reportDate: new Date("2024-01-15T09:20:00Z"),
        issueText: "依存関係の更新で若干のリソース問題が生じました",
        teamId: "team-003"
      },
      {
        reportId: "report-006",
        reportDate: new Date("2024-01-14T09:00:00Z"),
        issueText: "バグ対応中です",
        teamId: "team-001"
      },
      {
        reportId: "report-007",
        reportDate: new Date("2024-01-14T09:30:00Z"),
        issueText: "依存関係の解決が必要です",
        teamId: "team-002"
      },
      {
        reportId: "report-008",
        reportDate: new Date("2024-01-13T10:00:00Z"),
        issueText: "微妙な遅延が問題です",
        teamId: "team-003"
      },
      {
        reportId: "report-009",
        reportDate: new Date("2024-01-12T08:00:00Z"),
        issueText: "バグが複数発見されました",
        teamId: "team-001"
      },
      {
        reportId: "report-010",
        reportDate: new Date("2024-01-11T14:00:00Z"),
        issueText: "若干のリソース問題があります",
        teamId: "team-002"
      }
    ];

    const analysisStartDate = new Date("2023-12-16T00:00:00Z");
    const analysisEndDate = new Date("2024-01-15T23:59:59Z");
    const minimumConfidenceThreshold = 30;

    // 関数を呼び出す
    const result = extractAndRankIssuesFromReports({
      reports,
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold
    });

    // 期待結果の検証
    // 信頼度が30以上のキーワード: 'バグ'（信頼度100）と'依存関係'（信頼度75）
    // 信頼度が30未満のキーワード: '微妙な遅延'（信頼度29）と'若干のリソース問題'（信頼度15）
    
    // issues 配列に含まれるキーワード数の確認（30以上のみ）
    expect(result.issues.length).toBe(2);

    // 信頼度30以上のキーワードのみが含まれることを確認
    const extractedKeywords = result.issues.map(issue => issue.keyword);
    expect(extractedKeywords).toContain("バグ");
    expect(extractedKeywords).toContain("依存関係");
    
    // 信頼度30未満のキーワードが除外されていることを確認
    expect(extractedKeywords).not.toContain("微妙な遅延");
    expect(extractedKeywords).not.toContain("若干のリソース問題");

    // lowConfidenceIssueCount の検証（除外されたキーワード数）
    expect(result.lowConfidenceIssueCount).toBe(2);

    // totalIssueCount の検証（出力された課題数）
    expect(result.totalIssueCount).toBe(2);

    // analysisTimestamp が記録されていることを確認
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(result.analysisTimestamp.getTime()).toBeLessThanOrEqual(new Date().getTime());

    // 優先度スコアの降順確認（バグ優先度スコア100、依存関係優先度スコア75の想定）
    const bugIssue = result.issues.find(issue => issue.keyword === "バグ");
    const dependencyIssue = result.issues.find(issue => issue.keyword === "依存関係");
    
    expect(bugIssue).toBeDefined();
    expect(dependencyIssue).toBeDefined();
    
    if (bugIssue && dependencyIssue) {
      expect(bugIssue.priorityScore).toBeGreaterThanOrEqual(dependencyIssue.priorityScore);
    }
  });
});