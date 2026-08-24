import { describe, test, expect } from "@jest/globals";
import { evaluateDataAccessPermission } from "../../src/logic/auth-authorization";
import type { DataAccessEvaluationInput, DataAccessPermissionResult } from "../../src/logic/auth-authorization";

describe("ロールベース権限判定機能 - エンジニアが自チーム内の課題データを閲覧のみ", () => {
  // SCEN-2071
  test("エンジニアが自チーム内の課題データを閲覧のみできる", () => {
    // テストユーザー: engineer_user（ロール：エンジニア、所属チーム：チームA）
    const engineerUserInput: DataAccessEvaluationInput = {
      userId: "engineer_user",
      userRole: "engineer",
      userTeamId: "team_a",
      targetDataType: "issue",
      targetTeamId: "team_a",
      requestedOperation: "view",
    };

    // ステップ3: チームA内の課題データ詳細を閲覧可能
    const viewOwnTeamResult: DataAccessPermissionResult =
      evaluateDataAccessPermission(engineerUserInput);

    expect(viewOwnTeamResult.isPermitted).toBe(true);
    expect(viewOwnTeamResult.permittedOperations).toEqual(["view"]);
    expect(viewOwnTeamResult.dataScope).toBe("own_team");
    expect(viewOwnTeamResult.decryptionKey).toBeTruthy();

    // ステップ4: 編集・削除・ステータス変更操作は許可されない
    const editAttemptInput: DataAccessEvaluationInput = {
      userId: "engineer_user",
      userRole: "engineer",
      userTeamId: "team_a",
      targetDataType: "issue",
      targetTeamId: "team_a",
      requestedOperation: "edit",
    };

    const editAttemptResult: DataAccessPermissionResult =
      evaluateDataAccessPermission(editAttemptInput);

    expect(editAttemptResult.isPermitted).toBe(false);
    expect(editAttemptResult.permittedOperations).toEqual(["view"]);
    expect(editAttemptResult.dataScope).toBe("own_team");
    expect(editAttemptResult.decryptionKey).toBeNull();

    // ステップ5-6: チームB所属メンバーが入力した課題データへのアクセスを試行
    const unauthorizedAccessInput: DataAccessEvaluationInput = {
      userId: "engineer_user",
      userRole: "engineer",
      userTeamId: "team_a",
      targetDataType: "issue",
      targetTeamId: "team_b",
      requestedOperation: "view",
    };

    const unauthorizedAccessResult: DataAccessPermissionResult =
      evaluateDataAccessPermission(unauthorizedAccessInput);

    expect(unauthorizedAccessResult.isPermitted).toBe(false);
    expect(unauthorizedAccessResult.permittedOperations).toEqual([]);
    expect(unauthorizedAccessResult.dataScope).toBe("none");
    expect(unauthorizedAccessResult.decryptionKey).toBeNull();
  });
});