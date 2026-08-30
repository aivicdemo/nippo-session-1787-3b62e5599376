import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";

describe("朝会報告管理システム - Tx3Imp1Agent", () => {
  test("SCEN-010: 集約済み日報データが存在しない場合、エラーが発生する", async () => {
    const mockAiClient = {
      extractAndRankIssues: jest.fn(),
      classifyAndScoreIssues: jest.fn(),
      generatePrioritizedList: jest.fn(),
      buildEmailContent: jest.fn(),
      sendEmail: jest.fn(),
    };

    const mockAggregateReportsByPeriod = jest.fn().mockResolvedValue([]);

    jest.doMock("../../src/agents/tx-3-imp-1/aggregation", () => ({
      aggregateReportsByPeriod: mockAggregateReportsByPeriod,
    }));

    const input = {
      aggregationPeriodStartDate: "2026-01-01",
      aggregationPeriodEndDate: "2026-01-31",
      targetTeamIds: undefined,
      managerUserId: "manager001",
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
      fail("エラーが発生するはずです");
    } catch (error: unknown) {
      const err = error as { name: string; message: string };
      expect(err.name).toBe("AggregatedReportDataNotFound");
      expect(err.message).toBe(
        "集約済み日報データが見つかりません。集約処理を先に実行してください。"
      );
    }

    jest.unmock("../../src/agents/tx-3-imp-1/aggregation");
  });
});