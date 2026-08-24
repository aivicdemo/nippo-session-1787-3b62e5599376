import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア算出機能 - ダッシュボード強調表示権限判定エラーハンドリング", () => {
  // SCEN-919: [error] 課題優先度スコア算出機能 - 部長ユーザー権限の確認結果がnullのときダッシュボード強調表示権限判定が失敗し例外をスローする
  test("should throw error when manager authority check returns null during dashboard highlight validation", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "デプロイパイプラインの障害により本番反映が遅延している",
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: "2024-01-15",
      teamId: "team-dev-001",
    };

    expect(() => {
      calculateIssuePriorityScore(input, {
        checkManagerAuthority: () => null,
        validateDashboardHighlightAuthority: (managerAuthority) => {
          if (managerAuthority === null) {
            throw new TypeError(
              "Manager authority check returned null; cannot proceed with dashboard highlight validation"
            );
          }
          return true;
        },
      });
    }).toThrow(/Manager authority check returned null/);
  });
});