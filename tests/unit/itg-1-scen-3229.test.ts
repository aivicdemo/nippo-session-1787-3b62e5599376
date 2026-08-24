import { runTx9Imp1Agent } from "../../src/agents/tx-9-imp-1/orchestrator";
import type {
  Tx9Imp1AiClient,
  Tx9AgentInput,
} from "../../src/agents/tx-9-imp-1/orchestrator";

describe("tx-9-imp-1 orchestrator authorization", () => {
  // SCEN-3229
  test("should deny data access and tool operations for non-manager users", async () => {
    const nonManagerUserId = "user-standard-001";
    const aggregationStartDate = "2024-01-08";
    const aggregationEndDate = "2024-01-14";
    const targetTeamIds = ["team-001", "team-002"];

    const input: Tx9AgentInput = {
      aggregationPeriodStart: new Date("2024-01-08T00:00:00Z"),
      aggregationPeriodEnd: new Date("2024-01-14T23:59:59Z"),
      targetTeamIds: targetTeamIds,
      managerUserId: nonManagerUserId,
    };

    const accessDeniedError = new Error("権限がありません。部長ロールでのログインが必要です");
    accessDeniedError.name = "AccessDeniedException";

    const mockAiClient: Tx9Imp1AiClient = {
      action01AggregateReportData: jest.fn().mockRejectedValue(accessDeniedError),
      action02DetectUnsubmittedMembers: jest.fn().mockRejectedValue(accessDeniedError),
      action03QuantifyMetrics: jest.fn().mockRejectedValue(accessDeniedError),
      action04ClassifyIssues: jest.fn().mockRejectedValue(accessDeniedError),
      action05DetectRecurrencePatterns: jest.fn().mockRejectedValue(accessDeniedError),
      action06ProposeCountermeasures: jest.fn().mockRejectedValue(accessDeniedError),
      action07GenerateReport: jest.fn().mockRejectedValue(accessDeniedError),
    };

    await expect(runTx9Imp1Agent(input, mockAiClient)).rejects.toThrow(/権限/);

    expect(mockAiClient.action01AggregateReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregationPeriodStart: input.aggregationPeriodStart,
        aggregationPeriodEnd: input.aggregationPeriodEnd,
        targetTeamIds: targetTeamIds,
        managerUserId: nonManagerUserId,
      })
    );

    expect(mockAiClient.action03QuantifyMetrics).not.toHaveBeenCalled();
    expect(mockAiClient.action07GenerateReport).not.toHaveBeenCalled();
  });
});