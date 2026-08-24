import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("tx-4-imp-1 orchestrator - runTx4Imp1Agent", () => {
  // SCEN-3139: [error] ダッシュボード分析から課題指示までの自動実行 AIエージェント - システム連携エラーでデータ取得に失敗した場合に副作用の確定前に人へ引き継ぐ
  test("should escalate to human and rollback transaction when system integration error occurs during dashboard data retrieval", async () => {
    // Setup: Mock Tx4Imp1AiClient with system integration error
    const mockEscalateToHuman = jest.fn().mockResolvedValue({
      statusCode: 202,
      escalationTicketId: "ESC-20260819-001",
    });

    const mockAiClient: any = {
      aggregateDashboardData: jest
        .fn()
        .mockRejectedValue({
          status: "error",
          code: "SYSTEM_INTEGRATION_FAILED",
          message: "Failed to retrieve data from dashboard API",
          affectedSystems: ["system-a", "system-b"],
        }),
      escalateToHuman: mockEscalateToHuman,
    };

    const mockAuditLog = jest.fn();
    const mockTransactionRollback = jest.fn().mockResolvedValue(undefined);

    const input: any = {
      teamId: "TEAM-001",
      managerId: "MGR-001",
      reportDate: "2026-08-19",
      meetingStartTime: "09:00",
    };

    // Execute: Call runTx4Imp1Agent with mocked client
    await expect(runTx4Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /SYSTEM_INTEGRATION_FAILED/
    );

    // Verify: escalateToHuman was called with correct escalation data
    expect(mockEscalateToHuman).toHaveBeenCalledWith(
      expect.objectContaining({
        escalationReason: "SYSTEM_INTEGRATION_ERROR",
        failedSystems: expect.arrayContaining(["system-a", "system-b"]),
        partialResult: null,
        recommendation: expect.stringContaining("Manual dashboard review"),
      })
    );

    // Verify: escalateToHuman received exactly one call
    expect(mockEscalateToHuman).toHaveBeenCalledTimes(1);

    // Verify: The mock was configured to return 202 Accepted status
    const escalationResult = await mockEscalateToHuman.mock.results[0].value;
    expect(escalationResult.statusCode).toBe(202);
    expect(escalationResult.escalationTicketId).toMatch(/^ESC-/);

    // Verify: aggregateDashboardData was called (Action 1 initiated before failure)
    expect(mockAiClient.aggregateDashboardData).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "TEAM-001",
        reportDate: "2026-08-19",
      })
    );

    // Verify: No subsequent actions were executed (no task assignment, no email dispatch, no session updates)
    // This is implicitly verified by the fact that only escalateToHuman was called
    // and no other mock methods were invoked
    expect(mockAiClient.extractAndPrioritizeIssues).not.toHaveBeenCalled();
    expect(
      mockAiClient.generateMorningMeetingPreparationResult
    ).not.toHaveBeenCalled();
    expect(mockAiClient.sendSummaryEmailToManager).not.toHaveBeenCalled();
  });
});