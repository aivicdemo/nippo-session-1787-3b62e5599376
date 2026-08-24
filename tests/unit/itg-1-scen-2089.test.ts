import { evaluateDataAccessPermission } from "../../src/logic/auth-authorization";

describe("ロールベース権限判定機能", () => {
  // SCEN-2089
  test("課題データが所属チーム以外のチームに属するとき削除操作が拒否される", () => {
    const user_id = "user-A";
    const user_role: "engineer" | "manager" | "admin" = "engineer";
    const user_team_id = "team-X";
    const target_data_type: "issue" | "report" | "dashboard" = "issue";
    const target_team_id = "team-Y";
    const requested_operation: "view" | "edit" | "delete" = "delete";

    const result = evaluateDataAccessPermission({
      userId: user_id,
      userRole: user_role,
      userTeamId: user_team_id,
      targetDataType: target_data_type,
      targetTeamId: target_team_id,
      requestedOperation: requested_operation,
    });

    expect(result.isPermitted).toBe(false);
    expect(result.permittedOperations).toEqual([]);
    expect(result.dataScope).toBe("own_team");
    expect(result.decryptionKey).toBeNull();
  });
});