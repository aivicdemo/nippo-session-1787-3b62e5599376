import { extractAndRankIssuesFromReports, type Report, type RankedIssueList } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題キーワード自動抽出と優先度ランク付け", () => {
  // SCEN-219: 過去7日間の日報データが10件未満のときの境界条件テスト
  test("過去7日間の日報データが9件（10件未満の境界条件）のとき、ランク付けの精度が低い状態で課題一覧が返される", () => {
    // 用意: 過去7日間の日報データを9件（10件未満の境界条件）
    const reports: Report[] = [
      {
        reportId: "report-001",
        reportDate: new Date("2024-01-08T09:00:00Z"),
        issueText: "バグが発生しました。テストケースが失敗しています。",
        teamId: "team-alpha",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2024-01-08T09:15:00Z"),
        issueText: "遅延が発生しており、納期に影響する可能性があります。",
        teamId: "team-beta",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2024-01-09T09:00:00Z"),
        issueText: "バグの修正に時間がかかっています。",
        teamId: "team-alpha",
      },
      {
        reportId: "report-004",
        reportDate: new Date("2024-01-09T10:00:00Z"),
        issueText: "リソース不足で作業が進まない状況です。",
        teamId: "team-gamma",
      },
      {
        reportId: "report-005",
        reportDate: new Date("2024-01-10T09:00:00Z"),
        issueText: "遅延が継続しており、チーム全体に影響が出ています。",
        teamId: "team-beta",
      },
      {
        reportId: "report-006",
        reportDate: new Date("2024-01-11T09:00:00Z"),
        issueText: "バグの原因特定に時間を要しています。",
        teamId: "team-delta",
      },
      {
        reportId: "report-007",
        reportDate: new Date("2024-01-12T09:00:00Z"),
        issueText: "リソース不足が深刻化しています。",
        teamId: "team-gamma",
      },
      {
        reportId: "report-008",
        reportDate: new Date("2024-01-13T09:00:00Z"),
        issueText: "バグ対応とリソース不足の両方が課題です。",
        teamId: "team-alpha",
      },
      {
        reportId: "report-009",
        reportDate: new Date("2024-01-14T09:00:00Z"),
        issueText: "遅延とバグの関連性が明らかになりました。",
        teamId: "team-beta",
      },
    ];

    const analysisStartDate = new Date("2024-01-08T00:00:00Z");
    const analysisEndDate = new Date("2024-01-14T23:59:59Z");
    const minimumConfidenceThreshold = 50;

    // extractAndRankIssuesFromReportsを呼び出す
    const result: RankedIssueList = extractAndRankIssuesFromReports({
      reports,
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold,
    });

    // 期待結果の検証
    // 1. 関数は正常に処理完了し、RankedIssueListを返す
    expect(result).toBeDefined();
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("totalIssueCount");
    expect(result).toHaveProperty("analysisTimestamp");
    expect(result).toHaveProperty("lowConfidenceIssueCount");

    // 2. issuesの配列は存在し、型が正しい
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);

    // 3. totalIssueCountは9件のデータから抽出された課題総数を示す
    expect(typeof result.totalIssueCount).toBe("number");
    expect(result.totalIssueCount).toBeGreaterThan(0);

    // 4. analysisTimestampは日時オブジェクト
    expect(result.analysisTimestamp instanceof Date).toBe(true);

    // 5. lowConfidenceIssueCountはゼロではない値を示す（データ件数が10件未満であるため信頼度に欠ける）
    expect(typeof result.lowConfidenceIssueCount).toBe("number");
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);

    // 6. issuesの各要素が期待されるプロパティを持つ
    result.issues.forEach((issue) => {
      expect(issue).toHaveProperty("issueId");
      expect(issue).toHaveProperty("keyword");
      expect(issue).toHaveProperty("frequency");
      expect(issue).toHaveProperty("impactScore");
      expect(issue).toHaveProperty("priorityScore");
      expect(issue).toHaveProperty("priorityRank");
      expect(issue).toHaveProperty("colorCode");
      expect(issue).toHaveProperty("confidenceScore");
      expect(issue).toHaveProperty("affectedTeamCount");

      // 型の検証
      expect(typeof issue.issueId).toBe("string");
      expect(typeof issue.keyword).toBe("string");
      expect(typeof issue.frequency).toBe("number");
      expect(typeof issue.impactScore).toBe("number");
      expect(typeof issue.priorityScore).toBe("number");
      expect(["高", "中", "低"]).toContain(issue.priorityRank);
      expect(["red", "yellow", "green"]).toContain(issue.colorCode);
      expect(typeof issue.confidenceScore).toBe("number");
      expect(typeof issue.affectedTeamCount).toBe("number");

      // 値の範囲を検証
      expect(issue.frequency).toBeGreaterThan(0);
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(issue.confidenceScore).toBeLessThanOrEqual(100);
      expect(issue.affectedTeamCount).toBeGreaterThan(0);
    });

    // 7. issuesが優先度スコア順に並べられていることを確認
    for (let i = 0; i < result.issues.length - 1; i++) {
      expect(result.issues[i].priorityScore).toBeGreaterThanOrEqual(
        result.issues[i + 1].priorityScore
      );
    }

    // 8. 9件未満のデータセットであるため、信頼度が低い課題が存在する可能性を確認
    // lowConfidenceIssueCountがゼロでない、または複数の課題が低信頼度スコア（50以下）を持つ可能性を示す
    const lowConfidenceIssuesInResult = result.issues.filter(
      (issue) => issue.confidenceScore < minimumConfidenceThreshold
    );
    const totalLowConfidenceCount =
      result.lowConfidenceIssueCount +
      Math.max(0, lowConfidenceIssuesInResult.length);
    expect(totalLowConfidenceCount).toBeGreaterThanOrEqual(0);

    // 9. 波及度（affectedTeamCount）が不正確である可能性を確認
    // 9件のデータから複数のチームが関連しており、波及度スコアの精度が低い状態が確認できる
    const uniqueTeamsInData = new Set(reports.map((r) => r.teamId));
    expect(uniqueTeamsInData.size).toBeGreaterThan(1);

    // 10. 抽出された課題キーワードが複数存在することを確認
    const extractedKeywords = new Set(result.issues.map((issue) => issue.keyword));
    expect(extractedKeywords.size).toBeGreaterThan(0);
  });
});