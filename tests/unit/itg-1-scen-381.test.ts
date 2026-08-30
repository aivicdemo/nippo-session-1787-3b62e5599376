import { judgeAccessPermission } from "../../src/logic/access-control-and-permissions";

describe("朝会報告管理システム - アクセス制御と権限管理", () => {
  test("SCEN-381: エンジニアが許可されていないダッシュボードへのアクセスを試みた場合、アクセス拒否が返される", () => {
    // ユーザーID 'eng-001'、役割 'engineer' で、アクセス対象は 'dashboard' (全社レベルのダッシュボード)
    // エンジニアは 'team_overview' と 'personal' ダッシュボードのみにアクセス可能
    // 全社レベルダッシュボード (targetTeamId=null) へのアクセスは許可されない

    const result = judgeAccessPermission({
      userId: "eng-001",
      resourceType: "dashboard",
      operation: "view",
      targetTeamId: null,
      confidentialityLevel: "public",
    });

    // 期待結果: アクセス拒否、理由はダッシュボードへのアクセス権限がないこと
    expect(result.isPermitted).toBe(false);
    expect(result.denialReason).toMatch(/ダッシュボード/);
    expect(result.userRole).toBe("engineer");
  });
});