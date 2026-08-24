import { describe, test, expect, beforeEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア計算・色分け表示機能", () => {
  // SCEN-955
  test("ユーザー権限が部長でないとき処理を中止しエラーを返す", () => {
    // 一般社員権限のユーザーでテスト実行
    const generalEmployeeUserId = "employee_001";
    const generalEmployeeRole = "engineer"; // 部長ではない権限

    // テスト用入力データ
    const input: IssuePriorityScoringInput = {
      issueId: "issue_001",
      issueContent: "データベース接続タイムアウト",
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: "2024-01-15T09:00:00Z",
      teamId: "team_001",
    };

    // TextAnalysisServiceAdapterのスタブ（呼び出されないはず）
    const textAnalysisServiceAdapterStub = {
      assessImpactScore: jest
        .fn()
        .mockResolvedValue({ impactScore: 85, confidence: 0.95 }),
    };

    // 権限チェック付きの関数呼び出し
    // calculateIssuePriorityScore は権限チェックを実装し、
    // 権限が不足している場合は処理を中止してエラーを返す必要がある
    expect(() => {
      calculateIssuePriorityScore(input, {
        userId: generalEmployeeUserId,
        userRole: generalEmployeeRole,
        textAnalysisServiceAdapter: textAnalysisServiceAdapterStub,
      });
    }).toThrow(/部長権限/);

    // TextAnalysisServiceAdapterのメソッドが呼び出されていないことを確認
    // 権限チェックが外部API呼び出しより前に実行されることを保証
    expect(
      textAnalysisServiceAdapterStub.assessImpactScore
    ).not.toHaveBeenCalled();
  });
});