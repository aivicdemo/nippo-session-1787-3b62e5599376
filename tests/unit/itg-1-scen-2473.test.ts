import { describe, test, expect } from "@jest/globals";
import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("朝会報告管理システム - 日報送信", () => {
  test("SCEN-2473: 操作習熟度スコアが70点以上のとき合格判定が返される", () => {
    // スコア計算に必要な入力値を準備
    // 習熟度指標：操作ログ記録数、報告入力完了までの所要時間、UIエラー発生回数
    const operationLogCount = 25; // 操作ログ数が多い = 習熟度高い
    const completionTimeSeconds = 120; // 報告完了時間が短い = 習熟度高い
    const uiErrorCount = 0; // UIエラー発生が少ない = 習熟度高い

    // 習熟度スコア計算：
    // スコア = (操作ログ数 / 30) * 40 + (600 - 完了時間秒数) / 600 * 40 + (10 - エラー数) / 10 * 20
    // = (25 / 30) * 40 + (600 - 120) / 600 * 40 + (10 - 0) / 10 * 20
    // = 0.8333 * 40 + 0.8 * 40 + 1.0 * 20
    // = 33.33 + 32 + 20
    // = 85.33 (四捨五入して85点)
    const expectedProficiencyScore = 85;

    const submitInput = {
      userId: "engineer-001",
      teamId: "team-dev-alpha",
      yesterdayAccomplishment: "データベース最適化タスク完了",
      todayPlan: "API実装開始予定",
      challenges: "リソース不足の影響による遅延",
      reportDate: "2024-01-15",
      operationLogCount: operationLogCount,
      completionTimeSeconds: completionTimeSeconds,
      uiErrorCount: uiErrorCount,
    };

    // submitDailyReportを呼び出し、戻り値を取得
    const result = submitDailyReport(submitInput);

    // 習熟度スコアが計算され、80点以上になっているか確認
    expect(result.proficiencyScore).toBe(expectedProficiencyScore);

    // 合格判定が返されているか確認（スコア70以上 = 合格）
    expect(result.proficiencyStatus).toBe("pass");

    // 合格判定フラグがtrueであることを確認
    expect(result.isPassed).toBe(true);

    // 報告ID、送信タイムスタンプなどの基本情報が正しく格納されている
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe("string");
    expect(result.reportId.length).toBeGreaterThan(0);

    // 送信時刻がISO 8601形式で記録されている
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(result.submissionTimestamp)).toBe(true);

    // ダッシュボード表示用のデータモデルに習熟度情報が正しく格納されている
    expect(result.dashboardData).toBeDefined();
    expect(result.dashboardData.proficiencyScore).toBe(expectedProficiencyScore);
    expect(result.dashboardData.proficiencyStatus).toBe("pass");
    expect(result.dashboardData.userId).toBe("engineer-001");
    expect(result.dashboardData.teamId).toBe("team-dev-alpha");
    expect(result.dashboardData.reportDate).toBe("2024-01-15");

    // 外部サービス呼び出し情報が記録されていないことを確認
    // （NotificationServiceAdapter、TextAnalysisServiceAdapterは呼び出されていない）
    expect(result.externalServiceCalls).toBeUndefined();
    expect(result.notificationSent).toBeUndefined();
    expect(result.textAnalysisApplied).toBeUndefined();
  });
});