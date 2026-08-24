import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type { PrioritizeAndColorizeIssuesInput, ColorThresholdConfig } from "../../src/logic/issue-extraction-prioritization";

describe("優先度別課題ハイライト表示機能", () => {
  // SCEN-717
  test("色分けマッピング設定が空オブジェクトのとき処理がエラーになる", () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: "issue-001",
          priorityScore: 85,
          keyword: "データベース接続エラー",
          impactLevel: "high",
        },
      ],
      colorThresholds,
      requestedBy: "user-001",
    };

    expect(() => {
      prioritizeAndColorizeIssues(input, {});
    }).toThrow(/priorityColorMap|undefined|empty/);
  });
});