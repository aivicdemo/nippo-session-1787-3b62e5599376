import { authorizeRemindManagement, type AuthorizeRemindManagementInput, type AuthorizeRemindManagementOutput } from "../../src/logic/remind-notification-authorization";

describe("authorizeRemindManagement", () => {
  // SCEN-044
  test("should return authentication error when user is not authenticated", () => {
    const input: AuthorizeRemindManagementInput = {
      userId: "user-123",
      requestContext: {
        user: undefined,
        session: {},
      },
    };

    expect(() => authorizeRemindManagement(input)).toThrow(/認証/);
  });
});