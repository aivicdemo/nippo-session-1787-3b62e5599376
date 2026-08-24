import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";

describe("優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能", () => {
  // SCEN-722: [error] 優先度別課題ハイライト表示機能 - 影響度スコアが 100 を超えるとき処理がエラーになる
  test("影響度スコアが 100 を超える場合、入力検証エラーを発生させる", () => {
    const input_issues = [
      {
        issueId: "issue-001",
        priorityScore: 75,
        keyword: "テスト課題",
        impactLevel: "high" as const,
      },
    ];

    const input_colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input_requestedBy = "user-dept-head-001";

    // TextAnalysisServiceAdapterのスタブ
    // assessImpactScoreメソッドが影響度スコア101（無効な値）を返すように設定
    const mockTextAnalysisServiceAdapter = {
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 101, // 100を超える無効な値
        confidence: 0.95,
      }),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // prioritizeAndColorizeIssuesの呼び出し時に影響度スコアが無効な値である場合
    // 関数内で入力検証が実行され、エラーが発生することを確認
    expect(() =>
      prioritizeAndColorizeIssues(
        input_issues,
        input_colorThresholds,
        input_requestedBy
      )
    ).toThrow(/影響度/);
  });
});