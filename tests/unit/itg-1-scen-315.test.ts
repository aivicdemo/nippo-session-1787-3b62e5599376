import { getSubmissionStatus } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム - 提出状況集計", () => {
  test("SCEN-315: チームメンバーIDリストが空のとき、例外をスロー", async () => {
    const teamId = "team-001";
    const reportDate = "2026-08-20";
    const requesterId = "user-admin-001";

    const mockJudgeAccessPermission = jest.fn().mockResolvedValue(true);
    const mockRetrieveReportsByDateRange = jest
      .fn()
      .mockResolvedValue([]);
    const mockDecryptReportDataForManager = jest
      .fn()
      .mockResolvedValue(undefined);
    const mockGetTeamMembers = jest.fn().mockResolvedValue([]);

    const input = {
      teamId,
      reportDate,
      requesterId,
      _judgeAccessPermission: mockJudgeAccessPermission,
      _retrieveReportsByDateRange: mockRetrieveReportsByDateRange,
      _decryptReportDataForManager: mockDecryptReportDataForManager,
      _getTeamMembers: mockGetTeamMembers,
    };

    await expect(
      getSubmissionStatus(input as any)
    ).rejects.toThrow(/チームメンバーが登録されていません/);
  });
});