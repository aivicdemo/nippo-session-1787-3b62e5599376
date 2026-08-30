import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import { type Report } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出と優先度ランク付け", () => {
  // SCEN-530: 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する。 - 発生回数の閾値が0以下の場合という明示された境界条件で発生回数の閾値は1以上に設定されます
  test("should extract and rank issues from multiple reports with default confidence threshold and calculate priority scores correctly", () => {
    // Arrange: 入力データの構築
    const analysisStartDate = new Date("2025-01-01T00:00:00Z");
    const analysisEndDate = new Date("2025-01-31T23:59:59Z");
    const teamIds = ["team-001", "team-002"];

    const reports: Report[] = [
      {
        reportId: "report-001",
        reportDate: new Date("2025-01-15T09:00:00Z"),
        issueText: "ビルドエラーが発生した。デプロイが失敗した。",
        teamId: "team-001",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2025-01-16T09:00:00Z"),
        issueText: "ビルドエラーにより開発が遅延した。",
        teamId: "team-002",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2025-01-17T09:00:00Z"),
        issueText: "テスト環境でビルドエラーが再発した。",
        teamId: "team-001",
      },
    ];

    const input = {
      reports,
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumConfidenceThreshold: undefined, // デフォルト値50を使用
    };

    // Act: 関数呼び出し
    const result = extractAndRankIssuesFromReports(input);

    // Assert: 戻り値の検証
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.totalIssueCount).toBeGreaterThan(0);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);

    // 抽出された課題『ビルドエラー』を確認
    const buildErrorIssue = result.issues.find(
      (issue) => issue.keyword.includes("ビルド")
    );
    expect(buildErrorIssue).toBeDefined();

    if (buildErrorIssue) {
      // 発生回数が3であることを確認
      expect(buildErrorIssue.frequency).toBe(3);

      // 優先度スコアの計算を検証
      // 計算式: (frequency * 0.4 + affectedTeamCount * 0.35 + (affectedTeamCount / teamSize) * 100 * 0.25) 
      // frequency = 3, affectedTeamCount = 2 (team-001, team-002), teamSize = 2
      // = (3 * 0.4 + 2 * 0.35 + (2 / 2) * 100 * 0.25)
      // = (1.2 + 0.7 + 25)
      // = 26.9
      const expectedPriorityScore = 26.9;
      expect(buildErrorIssue.priorityScore).toBeCloseTo(expectedPriorityScore, 1);

      // 影響を受けたチーム数が2であることを確認
      expect(buildErrorIssue.affectedTeamCount).toBe(2);

      // 信頼度スコアがデフォルト値50以上であることを確認
      expect(buildErrorIssue.confidenceScore).toBeGreaterThanOrEqual(50);
    }

    // issues配列が優先度スコアの降順で並んでいることを確認
    for (let i = 0; i < result.issues.length - 1; i++) {
      expect(result.issues[i].priorityScore).toBeGreaterThanOrEqual(
        result.issues[i + 1].priorityScore
      );
    }
  });
});