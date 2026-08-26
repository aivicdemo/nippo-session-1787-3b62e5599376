import { listAvailableTeams } from "../../src/logic/team-member-selection";

describe("listAvailableTeams", () => {
  test("SCEN-034: returns permission denied error when user lacks access to reminder notification management screen", () => {
    const userIdWithoutPermission = "user-no-permission";

    const result = listAvailableTeams({
      userId: userIdWithoutPermission,
    });

    expect(result).toEqual({
      code: "PERMISSION_DENIED",
      message: "リマインド通知管理画面へのアクセス権限がありません。",
    });
  });
});