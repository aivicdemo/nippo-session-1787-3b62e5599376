import { extractAndRankIssueKeywords } from "../../src/logic/issue-analysis";

describe("issue-analysis: extractAndRankIssueKeywords", () => {
  // SCEN-1360: [normal] 重複課題の自動判定と統合 - 重複課題が0件の場合、元の課題リストがそのまま返される
  test("should return original issue list unchanged when no duplicate issues are detected", () => {
    const inputReportDataList = [
      {
        id: "report-1",
        teamId: "team-1",
        reportedBy: "user-1",
        reportedAt: "2024-01-15T08:30:00Z",
        yesterdayAccomplishments: "completed feature A",
        todayPlan: "work on feature B",
        issuesAndChallenges: "機能A",
        submittedAt: "2024-01-15T08:30:00Z",
      },
      {
        id: "report-2",
        teamId: "team-1",
        reportedBy: "user-2",
        reportedAt: "2024-01-15T08:35:00Z",
        yesterdayAccomplishments: "completed feature B",
        todayPlan: "work on feature C",
        issuesAndChallenges: "機能B",
        submittedAt: "2024-01-15T08:35:00Z",
      },
      {
        id: "report-3",
        teamId: "team-1",
        reportedBy: "user-3",
        reportedAt: "2024-01-15T08:40:00Z",
        yesterdayAccomplishments: "completed feature C",
        todayPlan: "work on feature D",
        issuesAndChallenges: "課題C",
        submittedAt: "2024-01-15T08:40:00Z",
      },
    ];

    const analysisStartDate = "2024-01-15";
    const analysisEndDate = "2024-01-15";
    const minFrequencyThreshold = 1;

    const result = extractAndRankIssueKeywords({
      reportDataList: inputReportDataList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold,
    });

    expect(result.keywords).toHaveLength(3);
    expect(result.totalIssueCount).toBe(3);

    const keywordTexts = result.keywords.map((kw) => kw.keyword);
    expect(keywordTexts).toContain("機能A");
    expect(keywordTexts).toContain("機能B");
    expect(keywordTexts).toContain("課題C");

    expect(result.keywords[0]).toMatchObject({
      keyword: expect.any(String),
      frequency: expect.any(Number),
      priorityScore: expect.any(Number),
      priorityColor: expect.stringMatching(/^(red|yellow|green)$/),
    });

    result.keywords.forEach((keyword) => {
      expect(keyword.frequency).toBeGreaterThanOrEqual(1);
      expect(keyword.priorityScore).toBeGreaterThanOrEqual(0);
      expect(keyword.priorityScore).toBeLessThanOrEqual(100);
    });

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.analysisExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});