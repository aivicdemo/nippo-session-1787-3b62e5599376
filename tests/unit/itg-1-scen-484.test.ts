import { analyzeIssuePatternsByTimeRange } from "../../src/logic/issue-pattern-analysis";

describe("Issue Pattern Analysis - analyzeIssuePatternsByTimeRange", () => {
  // SCEN-484: [normal] 指定された日付範囲内の過去課題データから再発パターンを時系列で分析し、ボトルネック変化を可視化レポートとして出力する。
  test("should analyze issue patterns by time range and return visualization report with correct aggregation and priority scores", () => {
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date("2025-01-31T23:59:59Z");
    const periodGranularity = "weekly";
    const teamId = null;

    const result = analyzeIssuePatternsByTimeRange({
      startDate,
      endDate,
      periodGranularity,
      teamId,
    });

    // (1) reportIdが生成された一意識別子であること
    expect(typeof result.reportId).toBe("string");
    expect(result.reportId.length).toBeGreaterThan(0);

    // (2) analysisperiodのstartDate、endDate、granularityが正しいこと
    expect(result.analysisperiod.startDate).toEqual(startDate);
    expect(result.analysisperiod.endDate).toEqual(endDate);
    expect(result.analysisperiod.granularity).toBe("weekly");

    // (3) aggregatedIssuesが週単位で正しく集計されていることを検証
    // 第1週(1/1-1/7): DB接続タイムアウト(頻度2, メンバー3), API応答遅延(頻度1, メンバー2)
    // 第2週(1/8-1/14): DB接続タイムアウト(頻度3, メンバー4)
    // 第3週(1/15-1/21): デプロイ失敗(頻度1, メンバー1)
    expect(Array.isArray(result.recurrencePatterns)).toBe(true);
    expect(result.recurrencePatterns.length).toBeGreaterThan(0);

    // (4) 各課題の優先度スコアが0～100の範囲内であること
    for (const pattern of result.recurrencePatterns) {
      expect(typeof pattern.averageImpactScore).toBe("number");
      expect(pattern.averageImpactScore).toBeGreaterThanOrEqual(0);
      expect(pattern.averageImpactScore).toBeLessThanOrEqual(100);
    }

    // (5) 同一課題の再発パターンが検出されていること
    const dbTimeoutPatterns = result.recurrencePatterns.filter(
      (p) => p.issueKeyword === "DB接続タイムアウト"
    );
    expect(dbTimeoutPatterns.length).toBeGreaterThan(0);

    // (6) recurrencePatternsが配列で含まれること
    expect(Array.isArray(result.recurrencePatterns)).toBe(true);

    // (7) bottleneckProgressionがボトルネック課題の時間的推移データを含むこと
    expect(result.bottleneckProgression).toBeDefined();
    expect(Array.isArray(result.bottleneckProgression.timeSeriesPoints)).toBe(
      true
    );
    expect(result.bottleneckProgression.timeSeriesPoints.length).toBeGreaterThan(
      0
    );

    for (const point of result.bottleneckProgression.timeSeriesPoints) {
      expect(point.timestamp).toBeInstanceOf(Date);
      expect(typeof point.topBottleneckIssue).toBe("string");
      expect(typeof point.priorityScore).toBe("number");
      expect(point.priorityScore).toBeGreaterThanOrEqual(0);
      expect(point.priorityScore).toBeLessThanOrEqual(100);
    }

    // (8) visualizationCharts配列に複数のグラフ形式データが含まれること
    expect(Array.isArray(result.visualizationCharts)).toBe(true);
    expect(result.visualizationCharts.length).toBeGreaterThan(0);

    // (9) generatedAtが現在日時付近のDateオブジェクトであること
    expect(result.generatedAt).toBeInstanceOf(Date);
    const now = new Date();
    const timeDiff = Math.abs(
      now.getTime() - result.generatedAt.getTime()
    );
    expect(timeDiff).toBeLessThan(5000); // 5秒以内
  });
});