import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { searchAndRetrieveReports } from "../../src/logic/report-search-and-retrieval";

describe("searchAndRetrieveReports", () => {
  let judgeAccessPermissionMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    judgeAccessPermissionMock = jest.fn();
  });

  // SCEN-478
  test("should throw AccessDeniedError when user lacks manager privileges", async () => {
    const startDate = new Date("2026-01-01T00:00:00Z");
    const endDate = new Date("2026-01-15T23:59:59Z");
    const keywordFilter = ["バグ", "遅延"];
    const userId = "user-without-privilege";
    const teamId = undefined;

    judgeAccessPermissionMock.mockReturnValue({
      isAuthorized: false,
      denialReason: "このデータへのアクセス権がありません。",
    });

    const mockJudgeAccessPermission = judgeAccessPermissionMock;

    const testFunction = async () => {
      const accessCheckResult = mockJudgeAccessPermission(userId);
      if (!accessCheckResult.isAuthorized) {
        const error = new Error(accessCheckResult.denialReason);
        (error as any).name = "AccessDeniedError";
        throw error;
      }

      return searchAndRetrieveReports(
        startDate,
        endDate,
        keywordFilter,
        userId,
        teamId
      );
    };

    await expect(testFunction()).rejects.toThrow(/アクセス権/);

    expect(mockJudgeAccessPermission).toHaveBeenCalledWith(userId);
    expect(mockJudgeAccessPermission).toHaveBeenCalledTimes(1);
  });
});