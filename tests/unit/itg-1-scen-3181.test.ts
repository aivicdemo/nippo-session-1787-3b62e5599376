import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-01';

describe('tx-7-imp-1: Monthly Report Generation Agent - Trigger Confirmation', () => {
  test('SCEN-3181: runTx7Imp1Agent executes Action 1 trigger confirmation on monthly 1st day', async () => {
    // Setup: Mock current date to 2026-01-01 (first day of month)
    const mockCurrentDate = new Date('2026-01-01T09:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);

    // Verify prompt module exports exist
    expect(buildAction01Prompt).toBeDefined();
    expect(typeof buildAction01Prompt).toBe('function');
    expect(ACTION_01_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_01_PROMPT_VERSION).toBe('string');

    // Create stub AI client that simulates trigger confirmation logic
    const auditLog: Array<{
      eventType: string;
      timestamp: Date;
      details: Record<string, unknown>;
    }> = [];

    const mockAiClient = {
      callAction01TriggerConfirmation: jest.fn(async (input: {
        triggerTimestamp: Date;
        targetMonth: string;
      }) => {
        const dayOfMonth = input.triggerTimestamp.getDate();
        const isFirstDay = dayOfMonth === 1;

        if (isFirstDay) {
          auditLog.push({
            eventType: 'TRIGGER_CONFIRMED',
            timestamp: input.triggerTimestamp,
            details: {
              message: 'Monthly report generation trigger verified on day 1',
              targetMonth: input.targetMonth,
            },
          });
          return {
            triggerConfirmed: true,
            triggeredAt: input.triggerTimestamp,
            targetMonth: input.targetMonth,
          };
        }

        return {
          triggerConfirmed: false,
          triggeredAt: input.triggerTimestamp,
          targetMonth: input.targetMonth,
        };
      }),

      callAction02DataExtraction: jest.fn(async () => ({
        status: 'pending',
      })),

      callAction03ReportGeneration: jest.fn(async () => ({
        status: 'pending',
      })),

      callAction04TimeSeriesAnalysis: jest.fn(async () => ({
        status: 'pending',
      })),

      callAction05BottleneckAnalysis: jest.fn(async () => ({
        status: 'pending',
      })),

      callAction06PerformanceMetrics: jest.fn(async () => ({
        status: 'pending',
      })),

      callAction07PriorityAssignment: jest.fn(async () => ({
        status: 'pending',
      })),

      callAction08Presentation: jest.fn(async () => ({
        status: 'pending',
      })),
    };

    // Prepare input for tx-7-imp-1 agent
    const agentInput = {
      triggerTimestamp: mockCurrentDate,
      targetMonth: '2026-01',
      managerUserId: 'manager_001',
      includeDetailedAnalysis: true,
    };

    // Execute agent orchestrator
    const agentResult = await runTx7Imp1Agent(agentInput, mockAiClient);

    // Verify Action 01 was called
    expect(mockAiClient.callAction01TriggerConfirmation).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction01TriggerConfirmation).toHaveBeenCalledWith({
      triggerTimestamp: mockCurrentDate,
      targetMonth: '2026-01',
    });

    // Verify trigger confirmation returned success
    const action01Result = await mockAiClient.callAction01TriggerConfirmation({
      triggerTimestamp: mockCurrentDate,
      targetMonth: '2026-01',
    });
    expect(action01Result.triggerConfirmed).toBe(true);
    expect(action01Result.targetMonth).toBe('2026-01');

    // Verify audit log contains TRIGGER_CONFIRMED event
    const triggerConfirmEvent = auditLog.find(
      (log) => log.eventType === 'TRIGGER_CONFIRMED'
    );
    expect(triggerConfirmEvent).toBeDefined();
    expect(triggerConfirmEvent?.eventType).toBe('TRIGGER_CONFIRMED');
    expect(triggerConfirmEvent?.details.message).toMatch(
      /Monthly report generation trigger verified on day 1/
    );
    expect(triggerConfirmEvent?.details.targetMonth).toBe('2026-01');

    // Verify subsequent actions are not yet called (waiting state)
    expect(mockAiClient.callAction02DataExtraction).not.toHaveBeenCalled();
    expect(mockAiClient.callAction03ReportGeneration).not.toHaveBeenCalled();
    expect(mockAiClient.callAction04TimeSeriesAnalysis).not.toHaveBeenCalled();
    expect(mockAiClient.callAction05BottleneckAnalysis).not.toHaveBeenCalled();
    expect(mockAiClient.callAction06PerformanceMetrics).not.toHaveBeenCalled();
    expect(mockAiClient.callAction07PriorityAssignment).not.toHaveBeenCalled();
    expect(mockAiClient.callAction08Presentation).not.toHaveBeenCalled();

    // Verify agent execution status
    expect(agentResult).toBeDefined();
    expect(agentResult.reportId).toBeDefined();
    expect(typeof agentResult.reportId).toBe('string');
    expect(agentResult.executionStatus).toBe('success');

    // Verify delivery timestamp is set to current mock time
    expect(agentResult.deliveryTimestamp).toEqual(mockCurrentDate);

    // Verify analysis result summary contains expected structure
    expect(agentResult.analysisResultSummary).toBeDefined();
    expect(agentResult.analysisResultSummary.topPriorityChallenges).toBeDefined();
    expect(Array.isArray(agentResult.analysisResultSummary.topPriorityChallenges)).toBe(
      true
    );
    expect(agentResult.analysisResultSummary.performanceMetrics).toBeDefined();
    expect(agentResult.analysisResultSummary.bottleneckTrend).toBeDefined();

    // Cleanup
    jest.useRealTimers();
  });
});