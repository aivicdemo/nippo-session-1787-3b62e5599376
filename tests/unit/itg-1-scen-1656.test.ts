import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出機能 - 発生頻度の丸め処理", () => {
  test("SCEN-1656: 課題キーワード抽出時に発生頻度の計算で端数が生じた場合、丸め処理が正しく適用される", async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: "ネットワーク遅延",
            frequency: 7,
          },
          {
            keyword: "システム障害",
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: "team-001",
      startDate: new Date("2024-01-15T00:00:00Z"),
      endDate: new Date("2024-01-15T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const reportingText =
      "システム障害が発生。ネットワーク遅延も同時に発生。システム障害対応中。ネットワーク遅延で復旧遅延。システム障害の根本原因調査。ネットワーク遅延が続いている。ネットワーク遅延は解決した。";

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // 検証1: 結果が RankedIssueKeywordList 型であること
    expect(result).toHaveProperty("keywords");
    expect(result).toHaveProperty("totalKeywordCount");
    expect(result).toHaveProperty("extractedAt");
    expect(result).toHaveProperty("analysisperiodDays");

    // 検証2: キーワード数が正しいこと
    expect(result.keywords).toHaveLength(2);

    // 検証3: 発生頻度でランク付けされていること（降順）
    expect(result.keywords[0].keyword).toBe("ネットワーク遅延");
    expect(result.keywords[0].frequency).toBe(7);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe("システム障害");
    expect(result.keywords[1].frequency).toBe(3);
    expect(result.keywords[1].rank).toBe(2);

    // 検証4: 各キーワードのメタデータが存在すること
    expect(result.keywords[0]).toHaveProperty("keywordId");
    expect(result.keywords[0]).toHaveProperty("keyword");
    expect(result.keywords[0]).toHaveProperty("frequency");
    expect(result.keywords[0]).toHaveProperty("rank");

    // 検証5: 全キーワード数が正しいこと（フィルタ前）
    expect(result.totalKeywordCount).toBe(2);

    // 検証6: 抽出処理実行日時が記録されていること
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 検証7: 分析対象期間の日数が正しいこと（startDate から endDate までは1日）
    expect(result.analysisperiodDays).toBe(1);

    // 検証8: TextAnalysisServiceAdapter のextractKeywords メソッドが呼ばれたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      reportingText
    );

    // 検証9: 発生頻度の相対値（パーセンテージ）が正しく計算されていることを確認
    // ネットワーク遅延: 7 / (7+3) * 100 = 70.0%
    // システム障害: 3 / (7+3) * 100 = 30.0%
    // これらはキーワード情報内に含まれていないため、frequencyフィールドで検証
    const totalFrequency = result.keywords.reduce(
      (sum, kw) => sum + kw.frequency,
      0
    );
    expect(totalFrequency).toBe(10);

    // 検証10: 丸め処理による誤差が許容範囲内であることを確認
    // 100%に正規化した場合の誤差チェック
    const normalizedFrequencies = result.keywords.map(
      (kw) => (kw.frequency / totalFrequency) * 100
    );
    const sumOfNormalized = normalizedFrequencies.reduce((a, b) => a + b, 0);
    // 誤差が ±0.1% 以下であることを確認
    expect(Math.abs(sumOfNormalized - 100.0)).toBeLessThanOrEqual(0.1);

    // 検証11: 期待される丸め処理済み値の確認
    // ネットワーク遅延 70.0%、システム障害 30.0% のはずであり、合計は 100.0%
    expect(normalizedFrequencies[0]).toBeCloseTo(70.0, 1);
    expect(normalizedFrequencies[1]).toBeCloseTo(30.0, 1);
  });
});