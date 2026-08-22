import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1Agent - System Integration Error Handling', () => {
  // SCEN-033
  test('should escalate to human and not execute subsequent actions when daily report system connection fails during Action 1', async () => {
    const mockAiClient: jest.Mocked<Tx1Imp1AiClient> = {
      executeAction01GetSubmissionStatus: jest.fn().mockRejectedValue(
        new Error('System integration error: Daily report API timeout (503 Service Unavailable)')
      ),
      executeAction02SendReminder: jest.fn(),
      executeAction03ExtractIssues: jest.fn(),
      executeAction04RankIssues: jest.fn(),
      executeAction05GenerateMaterial: jest.fn(),
      executeAction06SendCompletion: jest.fn(),
      escalateToHuman: jest.fn().mockResolvedValue({
        escalationId: 'ESC-20240115-001',
        timestamp: new Date('2024-01-15T09:05:00Z'),
        reason: 'System integration error: Daily report API timeout (503 Service Unavailable)',
        actionStage: 'Action 1',
        sideEffectConfirmed: false,
        notificationSent: true,
      }),
      recordAuditLog: jest.fn().mockResolvedValue({
        auditId: 'AUDIT-20240115-001',
        timestamp: new Date('2024-01-15T09:05:00Z'),
        eventType: 'ESCALATION',
        errorReason: 'System integration error: Daily report API timeout (503 Service Unavailable)',
        stoppedAtAction: 'Action 1',
        sideEffectStatus: 'NOT_CONFIRMED',
      }),
    };

    const input: Tx1Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: '09:00',
      morningMeetingStartTime: '09:30',
      teamMemberIds: ['EMP001', 'EMP002', 'EMP003'],
      managerEmail: 'manager@company.com',
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.aggregatedReportCount).toBe(0);
    expect(result.unsubmittedMemberCount).toBe(0);
    expect(result.extractedIssueCount).toBe(0);
    expect(result.prioritizedIssueList).toEqual([]);
    expect(result.summaryEmailSent).toBe(false);

    expect(mockAiClient.executeAction01GetSubmissionStatus).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction01GetSubmissionStatus).toHaveBeenCalledWith({
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      teamMemberIds: ['EMP001', 'EMP002', 'EMP003'],
    });

    expect(mockAiClient.executeAction02SendReminder).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction03ExtractIssues).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction04RankIssues).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction05GenerateMaterial).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction06SendCompletion).not.toHaveBeenCalled();

    expect(mockAiClient.escalateToHuman).toHaveBeenCalledTimes(1);
    expect(mockAiClient.escalateToHuman).toHaveBeenCalledWith({
      errorReason: 'System integration error: Daily report API timeout (503 Service Unavailable)',
      actionStage: 'Action 1',
      sideEffectConfirmed: false,
      managerEmail: 'manager@company.com',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    });

    expect(mockAiClient.recordAuditLog).toHaveBeenCalledTimes(1);
    expect(mockAiClient.recordAuditLog).toHaveBeenCalledWith({
      eventType: 'ESCALATION',
      errorReason: 'System integration error: Daily report API timeout (503 Service Unavailable)',
      stoppedAtAction: 'Action 1',
      sideEffectStatus: 'NOT_CONFIRMED',
      escalationNotificationSent: true,
      timestamp: new Date('2024-01-15T09:00:00Z'),
      managerEmail: 'manager@company.com',
    });

    expect(result.completionTimestamp).toBeInstanceOf(Date);
    expect(result.completionTimestamp.getTime()).toBeGreaterThanOrEqual(
      new Date('2024-01-15T09:00:00Z').getTime()
    );
  });
});