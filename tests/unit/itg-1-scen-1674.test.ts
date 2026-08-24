import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport, type ExtractedIssueData } from "../../src/logic/weekly-issue-analysis";

describe("週次課題傾向分析レポート生成", () => {
  // SCEN-1674
  test("同じ前週日報データで2回分析実行すると同じ結果が返される", () => {
    const analysisStartDate = "2024-01-08";
    const analysisEndDate = "2024-01-14";
    const teamId = "team-001";

    const extractedIssues: ExtractedIssueData[] = [
      {
        keyword: "API障害",
        occurrenceCount: 2,
        impactScore: 85,
      },
      {
        keyword: "デプロイ遅延",
        occurrenceCount: 2,
        impactScore: 75,
      },
      {
        keyword: "ドキュメント不足",
        occurrenceCount: 1,
        impactScore: 45,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: analysisStartDate,
      aggregationEndDate: analysisEndDate,
      extractedIssues: extractedIssues,
      teamId: teamId,
    };

    const firstResult: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);
    const secondResult: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);

    expect(firstResult.reportId).toBe(secondResult.reportId);
    expect(firstResult.aggregationPeriod.startDate).toBe(secondResult.aggregationPeriod.startDate);
    expect(firstResult.aggregationPeriod.endDate).toBe(secondResult.aggregationPeriod.endDate);
    expect(firstResult.aggregationPeriod.startDate).toBe(analysisStartDate);
    expect(firstResult.aggregationPeriod.endDate).toBe(analysisEndDate);

    expect(firstResult.issueRanking.length).toBe(3);
    expect(secondResult.issueRanking.length).toBe(3);

    expect(firstResult.issueRanking[0].issueKeyword).toBe("API障害");
    expect(firstResult.issueRanking[0].occurrenceCount).toBe(2);
    expect(firstResult.issueRanking[0].rank).toBe(1);
    expect(secondResult.issueRanking[0].issueKeyword).toBe("API障害");
    expect(secondResult.issueRanking[0].occurrenceCount).toBe(2);
    expect(secondResult.issueRanking[0].rank).toBe(1);

    expect(firstResult.issueRanking[1].issueKeyword).toBe("デプロイ遅延");
    expect(firstResult.issueRanking[1].occurrenceCount).toBe(2);
    expect(firstResult.issueRanking[1].rank).toBe(2);
    expect(secondResult.issueRanking[1].issueKeyword).toBe("デプロイ遅延");
    expect(secondResult.issueRanking[1].occurrenceCount).toBe(2);
    expect(secondResult.issueRanking[1].rank).toBe(2);

    expect(firstResult.issueRanking[2].issueKeyword).toBe("ドキュメント不足");
    expect(firstResult.issueRanking[2].occurrenceCount).toBe(1);
    expect(firstResult.issueRanking[2].rank).toBe(3);
    expect(secondResult.issueRanking[2].issueKeyword).toBe("ドキュメント不足");
    expect(secondResult.issueRanking[2].occurrenceCount).toBe(1);
    expect(secondResult.issueRanking[2].rank).toBe(3);

    expect(firstResult.priorityScores.length).toBe(3);
    expect(secondResult.priorityScores.length).toBe(3);

    const firstApiPriority = firstResult.priorityScores.find(
      (p) => p.issueId === "API障害"
    );
    const secondApiPriority = secondResult.priorityScores.find(
      (p) => p.issueId === "API障害"
    );
    expect(firstApiPriority).toBeDefined();
    expect(secondApiPriority).toBeDefined();
    expect(firstApiPriority!.priorityScore).toBe(secondApiPriority!.priorityScore);
    expect(firstApiPriority!.priorityRank).toBe(secondApiPriority!.priorityRank);

    const firstDeployPriority = firstResult.priorityScores.find(
      (p) => p.issueId === "デプロイ遅延"
    );
    const secondDeployPriority = secondResult.priorityScores.find(
      (p) => p.issueId === "デプロイ遅延"
    );
    expect(firstDeployPriority).toBeDefined();
    expect(secondDeployPriority).toBeDefined();
    expect(firstDeployPriority!.priorityScore).toBe(secondDeployPriority!.priorityScore);
    expect(firstDeployPriority!.priorityRank).toBe(secondDeployPriority!.priorityRank);

    const firstDocPriority = firstResult.priorityScores.find(
      (p) => p.issueId === "ドキュメント不足"
    );
    const secondDocPriority = secondResult.priorityScores.find(
      (p) => p.issueId === "ドキュメント不足"
    );
    expect(firstDocPriority).toBeDefined();
    expect(secondDocPriority).toBeDefined();
    expect(firstDocPriority!.priorityScore).toBe(secondDocPriority!.priorityScore);
    expect(firstDocPriority!.priorityRank).toBe(secondDocPriority!.priorityRank);

    expect(firstResult.recommendedCountermeasures.length).toBe(
      secondResult.recommendedCountermeasures.length
    );

    const firstJsonString = JSON.stringify(firstResult, null, 2);
    const secondJsonString = JSON.stringify(secondResult, null, 2);
    expect(firstJsonString).toBe(secondJsonString);
  });
});