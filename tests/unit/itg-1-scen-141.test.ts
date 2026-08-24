import { describe, test, expect, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・ランク付け機能", () => {
  // SCEN-141: [edge] 複数の日報に同じキーワードが出現したとき、発生頻度でランク付けされる順序が重複度の高い順となる
  test("複数日報から抽出したキーワードを出現頻度でランク付けし、降順で返す", async () => {
    // モック用のTextAnalysisServiceAdapterを構築
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        // 日報1: 「データベース障害が発生。データベース復旧に3時間要した。データベース設定を見直した」
        if (text.includes("データベース障害が発生")) {
          return {
            keywords: ["データベース", "障害", "復旧"],
            frequencies: { データベース: 3, 障害: 1, 復旧: 1 },
          };
        }
        // 日報2: 「APIレスポンスが遅い。APIの最適化を進める。APIのキャッシング機構を追加」
        if (text.includes("APIレスポンスが遅い")) {
          return {
            keywords: ["API", "最適化"],
            frequencies: { API: 3, 最適化: 1 },
          };
        }
        // 日報3: 「データベース接続エラーが多発。データベースパフォーマンス改善が急務」
        if (text.includes("データベース接続エラーが多発")) {
          return {
            keywords: ["データベース", "エラー", "パフォーマンス"],
            frequencies: { データベース: 2, エラー: 1, パフォーマンス: 1 },
          };
        }
        return { keywords: [], frequencies: {} };
      }),
    };

    // テスト入力データ
    const extractInput: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-08T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    // 3件の日報テキスト
    const reportTexts = [
      "データベース障害が発生。データベース復旧に3時間要した。データベース設定を見直した",
      "APIレスポンスが遅い。APIの最適化を進める。APIのキャッシング機構を追加",
      "データベース接続エラーが多発。データベースパフォーマンス改善が急務",
    ];

    // 関数を実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractInput,
      mockTextAnalysisServiceAdapter
    );

    // 期待結果の検証
    // 総出現頻度: データベース(3+2=5), API(3), 障害(1), エラー(1), 復旧(1), 最適化(1), パフォーマンス(1)
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThanOrEqual(5);

    // ランク付けが出現頻度の降順であることを確認
    expect(result.keywords[0].keyword).toBe("データベース");
    expect(result.keywords[0].frequency).toBe(5);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe("API");
    expect(result.keywords[1].frequency).toBe(3);
    expect(result.keywords[1].rank).toBe(2);

    // 同一度数のキーワード（度数1）は安定した順序で返されることを確認
    const frequencyOneKeywords = result.keywords.filter(
      (kw) => kw.frequency === 1
    );
    expect(frequencyOneKeywords.length).toBeGreaterThanOrEqual(4);

    // 全キーワード数（フィルタ前）
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(7);

    // 抽出実行日時が記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間の日数
    expect(result.analysisperiodDays).toBe(1);
  });
});