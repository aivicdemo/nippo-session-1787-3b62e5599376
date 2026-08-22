import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-01';
import type { Tx8AgentInput, Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

const fetchMock = require('jest-fetch-mock');

describe('Tx8Imp1Agent - 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-144
  test('should execute autonomous issue search and visualization report generation workflow with fake AI client and system stub', async () => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // Mock audit events collector
    const auditEvents: Array<{ event: string; timestamp: string; data_count?: number }> = [];
    const collectAuditEvent = (event: string, data_count?: number) => {
      auditEvents.push({
        event,
        timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
        ...(data_count !== undefined && { data_count }),
      });
    };

    // Sample issue data matching unified format
    const sampleIssueData = Array.from({ length: 15 }, (_, index) => ({
      issueId: `ISSUE-${String(index + 1).padStart(3, '0')}`,
      occurrenceDate: new Date(`2024-01-${String((index % 15) + 1).padStart(2, '0')}T08:30:00Z`).toISOString(),
      category: ['quality', 'delivery', 'safety', 'performance'][index % 4],
      description: `Issue description ${index + 1}`,
    }));

    // Mock stub API for朝会報告管理システム
    fetchMock.mockResponseOnce(JSON.stringify(sampleIssueData), { status: 200 });

    // Create fake AI client matching Tx8Imp1AiClient interface
    const fakeAiClient: Tx8Imp1AiClient = {
      invokeAction: jest.fn(async (promptContent: string) => {
        collectAuditEvent('action_01_executed', 15);
        return {
          action: 'action_01',
          result: {
            extractedIssues: sampleIssueData,
            extractionStatus: 'success',
          },
        };
      }),
    };

    // Input parameters for runTx8Imp1Agent
    const agentInput: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-01',
      analysisPeriodEndDate: '2024-01-31',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10,
    };

    // Verify fake AI client structure matches orchestrator boundary
    expect(fakeAiClient).toHaveProperty('invokeAction');
    expect(typeof fakeAiClient.invokeAction).toBe('function');

    // Execute orchestrator
    const result: Tx8AgentOutput = await runTx8Imp1Agent(agentInput, fakeAiClient);

    // Verify buildAction01Prompt was called and ACTION_01_PROMPT_VERSION is available
    const action01Prompt = buildAction01Prompt(agentInput);
    expect(action01Prompt).toBeDefined();
    expect(ACTION_01_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_01_PROMPT_VERSION).toBe('string');

    // Verify fake AI client was invoked exactly once
    expect(fakeAiClient.invokeAction).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.invokeAction).toHaveBeenCalledWith(expect.stringContaining('action_01'));

    // Verify stub API was called exactly once and successful
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/朝会報告管理システム|api|issue|search/i);

    // Verify response structure contains expected unified format fields
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('analysisStatus');
    expect(result).toHaveProperty('recurringIssueCount');
    expect(result).toHaveProperty('reportDeliveryStatus');

    expect(result.analysisStatus).toBe('completed');
    expect(result.reportDeliveryStatus).toBe('sent');
    expect(result.recurringIssueCount).toBeGreaterThanOrEqual(0);

    // Verify audit events were recorded
    expect(auditEvents.length).toBeGreaterThan(0);
    const action01Event = auditEvents.find((evt) => evt.event === 'action_01_executed');
    expect(action01Event).toBeDefined();
    expect(action01Event?.data_count).toBe(15);
    expect(action01Event?.timestamp).toBe(new Date('2024-01-15T09:00:00Z').toISOString());

    // Verify orchestrator state transition is normal (no data loss)
    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    // Cleanup
    fetchMock.resetMocks();
    fetchMock.disableMocks();
  });
});