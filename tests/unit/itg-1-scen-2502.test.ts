import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信処理", () => {
  // SCEN-2502: [edge] 操作習熟度スコア自動計算 - 初回ログインと報告送信の操作が同日内で完了したとき習熟度スコアが計算される
  test("初回ログイン後、同日内に報告を送信したときに操作習熟度スコアが自動計算される", async () => {
    const testUserId = "TEST_USER_001";
    const testTeamId = "TEAM_001";
    const reportDate = "2024-01-15";
    const loginTimestamp = new Date("2024-01-15T08:00:00Z");
    const submissionTimestamp = new Date("2024-01-15T09:30:00Z");

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "パフォーマンス", frequency: 2, confidenceScore: 0.85 },
          { keyword: "ネットワーク遅延", frequency: 1, confidenceScore: 0.78 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 72,
        affectedTeams: ["TEAM_001", "TEAM_002"],
        businessImpactLevel: "high"
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "medium",
        recommendedPriority: "high",
        estimatedResolutionDays: 3
      })
    };

    const submissionInput: SubmitDailyReportInput = {
      userId: testUserId,
      teamId: testTeamId,
      yesterdayAccomplishment: "データベース最適化を進めました。クエリ応答時間を15%改善できました。",
      todayPlan: "API統合テストの実装を開始します。エラーハンドリングを重点的に検証します。",
      challenges: "パフォーマンス問題が残っています。ネットワーク遅延の影響を調査中です。",
      reportDate: reportDate
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(
      submissionInput,
      mockTextAnalysisServiceAdapter,
      {
        loginTimestamp: loginTimestamp,
        submissionTimestamp: submissionTimestamp
      }
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe("string");
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.submissionTimestamp).toBe(submissionTimestamp.toISOString());

    expect(result.isWithinDeadline).toBe(true);

    expect(result.proficiencyScore).toBeDefined();
    expect(typeof result.proficiencyScore).toBe("number");
    expect(result.proficiencyScore).toBeGreaterThan(0);
    expect(result.proficiencyScore).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.proficiencyScore)).toBe(true);

    expect(result.proficiencyScoreCalculatedAt).toBeDefined();
    const calculatedAtTime = new Date(result.proficiencyScoreCalculatedAt);
    expect(calculatedAtTime.getTime()).toBeGreaterThanOrEqual(submissionTimestamp.getTime());
    expect(calculatedAtTime.getTime()).toBeLessThanOrEqual(submissionTimestamp.getTime() + 5 * 60 * 1000);

    const isSameDay =
      calculatedAtTime.getFullYear() === submissionTimestamp.getFullYear() &&
      calculatedAtTime.getMonth() === submissionTimestamp.getMonth() &&
      calculatedAtTime.getDate() === submissionTimestamp.getDate();
    expect(isSameDay).toBe(true);

    const operationDurationMinutes =
      (submissionTimestamp.getTime() - loginTimestamp.getTime()) / (1000 * 60);
    expect(operationDurationMinutes).toBe(90);
    expect(result.proficiencyScore).toBeGreaterThan(0);
  });
});