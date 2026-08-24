import { validateUserAuthorizationAndPermission } from "../../src/logic/auth-authorization";

describe("朝会報告管理システム - ロール別アクセス制御", () => {
  // SCEN-125
  test("部長ロールが日報入力フォームにアクセス時、他メンバーデータ編集機能は表示されない", () => {
    const managerUserId = "manager-user-001";
    const managerTeamId = "team-001";

    const authorizationInput: Parameters<
      typeof validateUserAuthorizationAndPermission
    >[0] = {
      userId: managerUserId,
      userRole: "manager",
      userTeamId: managerTeamId,
      targetDataType: "report",
      targetTeamId: managerTeamId,
      requestedOperation: "view",
    };

    const result = validateUserAuthorizationAndPermission(authorizationInput);

    expect(result.isPermitted).toBe(true);
    expect(result.permittedOperations).toEqual(["view", "edit"]);
    expect(result.dataScope).toBe("own_team");
    expect(result.decryptionKey).not.toBeNull();

    const editableFeatures = result.permittedOperations;
    expect(editableFeatures).not.toContain("delete");
    expect(editableFeatures).toContain("view");
    expect(editableFeatures).toContain("edit");

    expect(
      editableFeatures.filter(
        (op) =>
          op === "edit_other_member" || op === "delete_other_member" || op === "admin"
      )
    ).toHaveLength(0);
  });
});