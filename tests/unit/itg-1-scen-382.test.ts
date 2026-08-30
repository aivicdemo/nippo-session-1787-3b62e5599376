import { judgeAccessPermission } from "../../src/logic/access-control-and-permissions";

describe("Access Control and Permissions - judgeAccessPermission", () => {
  test("SCEN-382: throws error when user is not registered in the system", () => {
    const accessRequest = {
      userId: "user_not_found_12345",
      resourceType: "dashboard" as const,
      operation: "view" as const,
      targetTeamId: null,
    };

    expect(() => judgeAccessPermission(accessRequest)).toThrow(
      /ユーザーが見つかりません/
    );
  });
});