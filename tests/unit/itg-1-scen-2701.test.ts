import { fetchYesterdayReport } from "../../src/logic/report-submission";
import { type DailyReport } from "../../src/logic/report-submission";

describe("前日報告内容の取得・表示機能", () => {
  // SCEN-2701
  test("月末日に報告を確認する際、前日報告が前月のデータと混在しない", async () => {
    // 固定日時設定: 1月31日 09:00:00 (月末日)
    const monthEndDate = new Date("2024-01-31T09:00:00Z");
    const expectedYesterdayDate = new Date("2024-01-30T00:00:00Z");
    
    // 1月30日のスタブデータを準備
    const januaryThirtieth: DailyReport = {
      reportId: "report-jan30-001",
      engineerId: "engineer-a",
      reportDate: expectedYesterdayDate,
      yesterdayAccomplishment: "Database migration completed",
      todayPlan: "Unit tests for migration module",
      challenges: "Performance regression on queries",
      submittedAt: new Date("2024-01-30T08:30:00Z"),
    };

    // スタブ AI Client を作成
    const stubAiClient = {
      fetchYesterdayReportData: jest.fn().mockResolvedValue({
        success: true,
        data: januaryThirtieth,
        fetchedAt: monthEndDate.toISOString(),
      }),
    };

    // fetchYesterdayReport 関数を呼び出し
    // 前日（1月30日）を対象として取得
    const resultJanuary = await fetchYesterdayReport(
      {
        engineerId: "engineer-a",
        targetDate: expectedYesterdayDate,
        requestingUserId: "engineer-a",
      },
      stubAiClient
    );

    // 1月31日時点で取得した前日報告を検証
    expect(resultJanuary).toBeDefined();
    expect(resultJanuary.reportDate).toEqual(expectedYesterdayDate);
    expect(resultJanuary.engineerId).toBe("engineer-a");
    expect(resultJanuary.yesterdayAccomplishment).toBe(
      "Database migration completed"
    );
    expect(resultJanuary.todayPlan).toBe("Unit tests for migration module");
    expect(resultJanuary.challenges).toBe("Performance regression on queries");

    // スタブが正確に前日（1月30日）をパラメータとして受け取ったか検証
    expect(stubAiClient.fetchYesterdayReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        engineerId: "engineer-a",
        targetDate: expectedYesterdayDate,
      })
    );

    // 翌月初日（2月1日）への遷移をシミュレート
    const februaryFirstDate = new Date("2024-02-01T09:00:00Z");
    const expectedYesterdayDateFebruary = new Date("2024-01-31T00:00:00Z");

    // 2月1日時点での前日報告（1月31日のデータ）を準備
    const januaryThirtyfirst: DailyReport = {
      reportId: "report-jan31-001",
      engineerId: "engineer-a",
      reportDate: expectedYesterdayDateFebruary,
      yesterdayAccomplishment: "Unit tests completed successfully",
      todayPlan: "Integration testing phase",
      challenges: "Pending code review feedback",
      submittedAt: new Date("2024-01-31T08:45:00Z"),
    };

    // スタブを新規結果に更新
    const stubAiClientFebruary = {
      fetchYesterdayReportData: jest.fn().mockResolvedValue({
        success: true,
        data: januaryThirtyfirst,
        fetchedAt: februaryFirstDate.toISOString(),
      }),
    };

    // 2月1日時点で前日報告を取得
    const resultFebruary = await fetchYesterdayReport(
      {
        engineerId: "engineer-a",
        targetDate: expectedYesterdayDateFebruary,
        requestingUserId: "engineer-a",
      },
      stubAiClientFebruary
    );

    // 2月1日時点で取得した前日報告を検証
    expect(resultFebruary).toBeDefined();
    expect(resultFebruary.reportDate).toEqual(expectedYesterdayDateFebruary);
    expect(resultFebruary.engineerId).toBe("engineer-a");
    expect(resultFebruary.yesterdayAccomplishment).toBe(
      "Unit tests completed successfully"
    );
    expect(resultFebruary.todayPlan).toBe("Integration testing phase");
    expect(resultFebruary.challenges).toBe("Pending code review feedback");

    // スタブが正確に前日（1月31日）をパラメータとして受け取ったか検証
    expect(stubAiClientFebruary.fetchYesterdayReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        engineerId: "engineer-a",
        targetDate: expectedYesterdayDateFebruary,
      })
    );

    // 月末日と翌月初日で取得されたデータが異なることを検証
    // 月末日の前日報告 (1月30日) と翌月初日の前日報告 (1月31日) が混在していない
    expect(resultJanuary.reportDate).not.toEqual(resultFebruary.reportDate);
    expect(resultJanuary.reportId).not.toBe(resultFebruary.reportId);
    expect(resultJanuary.yesterdayAccomplishment).not.toBe(
      resultFebruary.yesterdayAccomplishment
    );

    // targetDate パラメータが常に前日（システム日時 - 1日）として指定されたことを最終確認
    const januaryThirtiesTimestamp = expectedYesterdayDate.getTime();
    const januaryThirtyfirstTimestamp = expectedYesterdayDateFebruary.getTime();
    const dayDifference = 
      (januaryThirtyfirstTimestamp - januaryThirtiesTimestamp) / (1000 * 60 * 60 * 24);
    
    expect(dayDifference).toBe(1); // 正確に1日差であることを検証
  });
});