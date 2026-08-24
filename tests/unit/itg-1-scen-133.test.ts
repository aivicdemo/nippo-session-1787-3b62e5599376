import { validateUserAuthorizationAndPermission } from "../../src/logic/auth-authorization";

describe("ユーザー役割による機能アクセス制御", () => {
  // SCEN-133
  test("定義されていない役割値が渡されたとき、アクセス制御がエラーを返す", () => {
    const input: {
      userId: string;
      requestedFeature: string;
      userRole: string;
      targetTeamId?: string;
      targetDataType?: string;
    } = {
      userId: "user-001",
      requestedFeature: "日報入力",
      userRole: "admin",
      targetTeamId: "team-001",
      targetDataType: "全チーム進捗",
    };

    try {
      validateUserAuthorizationAndPermission(input);
      fail("エラーが発生するべき");
    } catch (error: unknown) {
      const err = error as {
        errorCode?: string;
        errorMessage?: string;
        statusCode?: number;
      };

      expect(err.errorCode).toBe("INVALID_ROLE");
      expect(err.errorMessage).toMatch(/指定された役割.*admin.*定義されていません/);
      expect(err.statusCode).toBe(403);
    }
  });
});