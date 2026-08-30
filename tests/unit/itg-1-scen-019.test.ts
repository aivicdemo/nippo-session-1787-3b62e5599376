import { runTx6Imp1Agent } from "../../src/agents/tx-6-imp-1/orchestrator";

describe("朝会報告管理システム - TX6エージェント", () => {
  // SCEN-019
  test("前週の日報データが取得できない場合、PreviousWeekDataNotAvailableError を発生させる", async () => {
    const executionTimestamp = new Date("2024-01-15T06:00:00Z");
    const targetWeekStartDate = new Date("2024-01-08T00:00:00Z");
    const targetWeekEndDate = new Date("2024-01-14T23:59:59Z");
    const managerUserId = "manager-001";

    const mockAiClient = {
      extractWeeklyReportData: jest.fn().mockResolvedValue({
        extractedReports: [],
        extractionPeriodStart: targetWeekStartDate.toISOString(),
        extractionPeriodEnd: targetWeekEndDate.toISOString(),
        totalReportCount: 0,
        teamMembersCovered: [],
      }),
      generateWeeklyAnalysisReport: jest.fn(),
      generateAndSendManagerConfirmationEmail: jest.fn(),
    };

    const aggregateReportsByPeriodStub = jest
      .fn()
      .mockResolvedValue([]);

    const call = async () => {
      return runTx6Imp1Agent(
        {
          executionTimestamp,
          targetWeekStartDate,
          targetWeekEndDate,
          managerUserId,
        },
        mockAiClient,
        aggregateReportsByPeriodStub
      );
    };

    await expect(call()).rejects.toThrow(/前週の日報データが利用できません/);

    expect(mockAiClient.generateWeeklyAnalysisReport).not.toHaveBeenCalled();
    expect(
      mockAiClient.generateAndSendManagerConfirmationEmail
    ).not.toHaveBeenCalled();
  });
});