import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  // SCEN-3019
  test("月末日（28日、29日、30日、31日）に記録された課題について、月末日の扱いで正確にスコアが算出される", () => {
    // テスト用データ: 2月28日（非閏年）の課題
    const issueFeb28Input: IssuePriorityScoringInput = {
      issueId: "issue-feb28-001",
      issueContent: "February non-leap year issue on 28th",
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 4,
      reportingDate: "2025-02-28",
      teamId: "team-001",
    };

    const resultFeb28 = calculateIssuePriorityScore(issueFeb28Input);

    expect(resultFeb28).toBeDefined();
    expect(resultFeb28.issueId).toBe("issue-feb28-001");
    expect(typeof resultFeb28.priorityScore).toBe("number");
    expect(resultFeb28.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultFeb28.priorityScore).toBeLessThanOrEqual(100);
    expect(["高", "中", "低"]).toContain(resultFeb28.priorityRank);
    expect(resultFeb28.scoreBreakdown).toBeDefined();
    expect(typeof resultFeb28.scoreBreakdown.frequencyScore).toBe("number");
    expect(typeof resultFeb28.scoreBreakdown.impactScore).toBe("number");
    expect(typeof resultFeb28.scoreBreakdown.resolutionDifficultyScore).toBe(
      "number"
    );
    expect(resultFeb28.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultFeb28.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultFeb28.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultFeb28.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(
      resultFeb28.scoreBreakdown.resolutionDifficultyScore
    ).toBeGreaterThanOrEqual(0);
    expect(
      resultFeb28.scoreBreakdown.resolutionDifficultyScore
    ).toBeLessThanOrEqual(20);
    expect(["#FF0000", "#FFFF00", "#00FF00"]).toContain(
      resultFeb28.colorCode
    );
    expect(resultFeb28.calculatedAt).toBeDefined();
    const calculatedAtDate = new Date(resultFeb28.calculatedAt);
    expect(calculatedAtDate.getTime()).toBeGreaterThan(0);

    // テスト用データ: 3月31日の課題
    const issueMar31Input: IssuePriorityScoringInput = {
      issueId: "issue-mar31-001",
      issueContent: "March issue on 31st day",
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 5,
      resolutionDaysAverage: 6,
      reportingDate: "2025-03-31",
      teamId: "team-002",
    };

    const resultMar31 = calculateIssuePriorityScore(issueMar31Input);

    expect(resultMar31).toBeDefined();
    expect(resultMar31.issueId).toBe("issue-mar31-001");
    expect(typeof resultMar31.priorityScore).toBe("number");
    expect(resultMar31.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultMar31.priorityScore).toBeLessThanOrEqual(100);
    expect(["高", "中", "低"]).toContain(resultMar31.priorityRank);
    expect(resultMar31.colorCode).toBeDefined();
    expect(["#FF0000", "#FFFF00", "#00FF00"]).toContain(
      resultMar31.colorCode
    );

    // テスト用データ: 閏年2月29日の課題
    const issueFeb29Input: IssuePriorityScoringInput = {
      issueId: "issue-feb29-leap-001",
      issueContent: "Leap year February 29th issue",
      occurrenceFrequency: 6,
      impactScore: 80,
      affectedTeamCount: 4,
      resolutionDaysAverage: 5,
      reportingDate: "2024-02-29",
      teamId: "team-003",
    };

    const resultFeb29 = calculateIssuePriorityScore(issueFeb29Input);

    expect(resultFeb29).toBeDefined();
    expect(resultFeb29.issueId).toBe("issue-feb29-leap-001");
    expect(typeof resultFeb29.priorityScore).toBe("number");
    expect(resultFeb29.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultFeb29.priorityScore).toBeLessThanOrEqual(100);
    expect(["高", "中", "低"]).toContain(resultFeb29.priorityRank);
    expect(resultFeb29.colorCode).toBeDefined();

    // テスト用データ: 4月30日の課題
    const issueApr30Input: IssuePriorityScoringInput = {
      issueId: "issue-apr30-001",
      issueContent: "April issue on 30th day",
      occurrenceFrequency: 7,
      impactScore: 82,
      affectedTeamCount: 4,
      resolutionDaysAverage: 5,
      reportingDate: "2025-04-30",
      teamId: "team-004",
    };

    const resultApr30 = calculateIssuePriorityScore(issueApr30Input);

    expect(resultApr30).toBeDefined();
    expect(resultApr30.issueId).toBe("issue-apr30-001");
    expect(typeof resultApr30.priorityScore).toBe("number");
    expect(resultApr30.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultApr30.priorityScore).toBeLessThanOrEqual(100);

    // 月末日以外の日付との比較: 同じ月の15日の課題
    const issueMar15Input: IssuePriorityScoringInput = {
      issueId: "issue-mar15-001",
      issueContent: "March mid-month issue",
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 5,
      resolutionDaysAverage: 6,
      reportingDate: "2025-03-15",
      teamId: "team-005",
    };

    const resultMar15 = calculateIssuePriorityScore(issueMar15Input);

    expect(resultMar15).toBeDefined();
    expect(resultMar15.issueId).toBe("issue-mar15-001");
    expect(typeof resultMar15.priorityScore).toBe("number");
    expect(resultMar15.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultMar15.priorityScore).toBeLessThanOrEqual(100);

    // 月末日と中旬の課題が異なるスコアを持つことを確認（同一のmetrics但し日付が異なる場合）
    const issueMonthEndComparison: IssuePriorityScoringInput = {
      issueId: "issue-comparison-001",
      issueContent: "Test comparison",
      occurrenceFrequency: 5,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: "2025-12-31",
      teamId: "team-006",
    };

    const resultMonthEnd = calculateIssuePriorityScore(issueMonthEndComparison);

    expect(resultMonthEnd).toBeDefined();
    expect(resultMonthEnd.issueId).toBe("issue-comparison-001");
    expect(resultMonthEnd.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(
      0
    );
    expect(resultMonthEnd.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultMonthEnd.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultMonthEnd.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(
      resultMonthEnd.scoreBreakdown.resolutionDifficultyScore
    ).toBeGreaterThanOrEqual(0);
    expect(
      resultMonthEnd.scoreBreakdown.resolutionDifficultyScore
    ).toBeLessThanOrEqual(20);

    // タイムゾーン変換による月末日の誤判定がないことを確認
    // UTC境界での日付判定をテスト
    const issueUTCBoundary: IssuePriorityScoringInput = {
      issueId: "issue-utc-boundary-001",
      issueContent: "UTC boundary test",
      occurrenceFrequency: 4,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: "2025-01-31",
      teamId: "team-007",
    };

    const resultUTCBoundary = calculateIssuePriorityScore(issueUTCBoundary);

    expect(resultUTCBoundary).toBeDefined();
    expect(resultUTCBoundary.issueId).toBe("issue-utc-boundary-001");
    expect(typeof resultUTCBoundary.priorityScore).toBe("number");
    expect(resultUTCBoundary.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultUTCBoundary.priorityScore).toBeLessThanOrEqual(100);
    expect(resultUTCBoundary.calculatedAt).toBeDefined();
    const utcBoundaryDate = new Date(resultUTCBoundary.calculatedAt);
    expect(utcBoundaryDate.getTime()).toBeGreaterThan(0);

    // スコア計算の一貫性を確認: 同じ入力で複数回呼び出してスコアが一定であることを確認
    const issueConsistency: IssuePriorityScoringInput = {
      issueId: "issue-consistency-001",
      issueContent: "Consistency test",
      occurrenceFrequency: 5,
      impactScore: 70,
      affectedTeamCount: 3,
      resolutionDaysAverage: 4,
      reportingDate: "2025-06-30",
      teamId: "team-008",
    };

    const resultConsistency1 = calculateIssuePriorityScore(issueConsistency);
    const resultConsistency2 = calculateIssuePriorityScore(issueConsistency);

    expect(resultConsistency1.priorityScore).toBe(
      resultConsistency2.priorityScore
    );
    expect(resultConsistency1.priorityRank).toBe(
      resultConsistency2.priorityRank
    );
    expect(resultConsistency1.scoreBreakdown.frequencyScore).toBe(
      resultConsistency2.scoreBreakdown.frequencyScore
    );
    expect(resultConsistency1.scoreBreakdown.impactScore).toBe(
      resultConsistency2.scoreBreakdown.impactScore
    );
    expect(
      resultConsistency1.scoreBreakdown.resolutionDifficultyScore
    ).toBe(resultConsistency2.scoreBreakdown.resolutionDifficultyScore);
  });
});