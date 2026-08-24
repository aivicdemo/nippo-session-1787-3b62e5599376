import { evaluateDataAccessPermission } from "../../src/logic/auth-authorization";
import { type DataAccessEvaluationInput, type DataAccessPermissionResult } from "../../src/logic/auth-authorization";

// SCEN-138
describe("日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能", () => {
  test("SCEN-138: エンジニア役割ユーザーが日報入力フォームにアクセスしたとき、入力可能な機能のみ表示される", () => {
    // Precondition: エンジニア役割ユーザーでログインし、朝会報告管理システムが稼働している状態
    // Trigger: エンジニアが日報入力フォームにアクセスするとき
    // Expected outcome: エンジニア役割に応じて、アクセス可能な機能と表示内容が自動的に制限される

    const engineerInput: DataAccessEvaluationInput = {
      userId: "eng_user_001",
      userRole: "engineer",
      userTeamId: "team_001",
      targetDataType: "report",
      targetTeamId: "team_001",
      requestedOperation: "view",
    };

    const result: DataAccessPermissionResult = evaluateDataAccessPermission(engineerInput);

    // アクセス権限チェック: エンジニアは自分のチーム内での日報作成・閲覧が許可される
    expect(result.isPermitted).toBe(true);

    // 許可される操作: view のみ（作成・編集・削除ではなく、指定されたとおり view を許可）
    expect(result.permittedOperations).toEqual(["view"]);

    // データスコープ: 自分のチームのみ（他のチームの日報は見られない）
    expect(result.dataScope).toBe("own_team");

    // 復号化鍵: アクセスが許可されているため鍵が返される（暗号化された日報内容を閲覧可能）
    expect(result.decryptionKey).not.toBeNull();
    expect(typeof result.decryptionKey).toBe("string");
    expect(result.decryptionKey!.length).toBeGreaterThan(0);
  });
});