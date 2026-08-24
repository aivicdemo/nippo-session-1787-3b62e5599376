import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: Monthly Report Generation with Timeout and Disabled Retry', () => {
  let mockAiClient: Tx7Imp1AiClient;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;
  let timeoutDelayMs: number;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    timeoutDelayMs = 35000; // 35 seconds to exceed 30-second timeout

    mockAiClient = {
      extractKeywordsWithTimeout: jest.fn(async () => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('TimeoutError: Analysis request timed out'));
          }, timeoutDelayMs);
        });
      }),
      assessImpactScore: jest.fn(async () => ({
        impactLevel: 'high',
        score: 85,
      })),
      classifyIssueSeverity: jest.fn(async () => ({
        severity: 'high',
        confidence: 0.92,
      })),
      generateMonthlyReport: jest.fn(async () => ({
        reportId: 'report-2024-01',
        generatedAt: new Date('2024-02-01T09:00:00Z'),
      })),
      analyzeBottleneckTrend: jest.fn(async () => ({
        improvementTrend: 'deteriorating',
        recurringIssuePattern: ['Database connectivity', 'API timeout'],
      })),
      calculateTeamPerformanceMetrics: jest.fn(async () => ({
        averageResolutionDays: 4.5,
        reportSubmissionRate: 0.88,
        issueRecurrenceRate: 0.22,
      })),
      sendReportNotification: jest.fn(async () => ({
        emailSentTo: ['manager@company.com'],
        sentAt: new Date('2024-02-01T09:15:00Z'),
      })),
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-1856: Timeout with retry disabled should throw error without retry attempt
  it('should throw TimeoutError when retry is disabled and extraction times out', async () => {
    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-02-01T08:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'mgr-001',
      includeDetailedAnalysis: true,
    };

    const retryEnabledFlag = false;

    try {
      await runTx7Imp1Agent(agentInput, mockAiClient, retryEnabledFlag);
      expect.fail('Expected TimeoutError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/TimeoutError.*timed out/);
    }

    // Verify that extractKeywordsWithTimeout was called exactly once (no retry)
    expect(mockAiClient.extractKeywordsWithTimeout).toHaveBeenCalledTimes(1);

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorLog = consoleErrorSpy.mock.calls[0]?.[0] as string;
    expect(errorLog).toMatch(/Timeout occurred and retry is disabled/);
  });
});