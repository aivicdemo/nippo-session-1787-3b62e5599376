import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx2Imp1Agent, type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/types';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行', () => {
  // SCEN-3111
  test('should execute all 6 autonomous actions with complete audit trail from report collection through email delivery', async () => {
    const auditRecords: Array<{
      action: string;
      status: string;
      timestamp: Date;
      orchestration_status?: string;
      completion_timestamp?: Date;
    }> = [];

    const mockAiClient: Tx2Imp1AiClient = {
      buildAction01Prompt: async (prompt: string) => {
        const startRecord = {
          action: 'ACTION_01',
          status: 'STARTED',
          timestamp: new Date('2024-01-15T09:00:00Z'),
        };
        auditRecords.push(startRecord);

        const completedRecord = {
          action: 'ACTION_01',
          status: 'COMPLETED',
          timestamp: new Date('2024-01-15T09:05:00Z'),
        };
        auditRecords.push(completedRecord);

        return {
          status: 'success',
          message: 'All members report status retrieved',
          submittedCount: 8,
          unsubmittedCount: 2,
        };
      },

      buildAction02Prompt: async (prompt: string) => {
        const startRecord = {
          action: 'ACTION_02',
          status: 'STARTED',
          timestamp: new Date('2024-01-15T09:05:00Z'),
        };
        auditRecords.push(startRecord);

        const completedRecord = {
          action: 'ACTION_02',
          status: 'COMPLETED',
          timestamp: new Date('2024-01-15T09:10:00Z'),
        };
        auditRecords.push(completedRecord);

        return {
          status: 'success',
          message: 'Reports converted to unified format',
          convertedReportCount: 8,
        };
      },

      buildAction03Prompt: async (prompt: string) => {
        const startRecord = {
          action: 'ACTION_03',
          status: 'STARTED',
          timestamp: new Date('2024-01-15T09:10:00Z'),
        };
        auditRecords.push(startRecord);

        const completedRecord = {
          action: 'ACTION_03',
          status: 'COMPLETED',
          timestamp: new Date('2024-01-15T09:15:00Z'),
        };
        auditRecords.push(completedRecord);

        return {
          status: 'success',
          message: 'Issues, risks, and achievements extracted',
          extractedIssueCount: 12,
          extractedRiskCount: 3,
          extractedAchievementCount: 8,
        };
      },

      buildAction04Prompt: async (prompt: string) => {
        const startRecord = {
          action: 'ACTION_04',
          status: 'STARTED',
          timestamp: new Date('2024-01-15T09:15:00Z'),
        };
        auditRecords.push(startRecord);

        const completedRecord = {
          action: 'ACTION_04',
          status: 'COMPLETED',
          timestamp: new Date('2024-01-15T09:20:00Z'),
        };
        auditRecords.push(completedRecord);

        return {
          status: 'success',
          message: 'Issues organized and color-coded by priority',
          priorityHighCount: 3,
          priorityMediumCount: 6,
          priorityLowCount: 3,
        };
      },

      buildAction05Prompt: async (prompt: string) => {
        const startRecord = {
          action: 'ACTION_05',
          status: 'STARTED',
          timestamp: new Date('2024-01-15T09:20:00Z'),
        };
        auditRecords.push(startRecord);

        const completedRecord = {
          action: 'ACTION_05',
          status: 'COMPLETED',
          timestamp: new Date('2024-01-15T09:25:00Z'),
        };
        auditRecords.push(completedRecord);

        return {
          status: 'success',
          message: 'Non-submitting members identified',
          unsubmittedMembers: [
            { userId: 'user-002', name: 'Member A' },
            { userId: 'user-008', name: 'Member B' },
          ],
        };
      },

      buildAction06Prompt: async (prompt: string) => {
        const startRecord = {
          action: 'ACTION_06',
          status: 'STARTED',
          timestamp: new Date('2024-01-15T09:25:00Z'),
        };
        auditRecords.push(startRecord);

        const completedRecord = {
          action: 'ACTION_06',
          status: 'COMPLETED',
          timestamp: new Date('2024-01-15T09:30:00Z'),
        };
        auditRecords.push(completedRecord);

        return {
          status: 'success',
          message: 'Confirmation email generated and dispatched',
          emailSent: true,
          recipientCount: 1,
        };
      },
    };

    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      targetTeamIds: ['team-001'],
      managerUserIds: ['manager-001'],
    };

    const result = await runTx2Imp1Agent(agentInput, mockAiClient);

    expect(result.aggregatedReportCount).toBe(8);
    expect(result.extractedIssueCount).toBe(12);
    expect(result.confirmationEmailSent).toBe(true);
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);

    const action01Records = auditRecords.filter((r) => r.action === 'ACTION_01');
    expect(action01Records.length).toBe(2);
    expect(action01Records[0].status).toBe('STARTED');
    expect(action01Records[1].status).toBe('COMPLETED');

    const action02Records = auditRecords.filter((r) => r.action === 'ACTION_02');
    expect(action02Records.length).toBe(2);
    expect(action02Records[0].status).toBe('STARTED');
    expect(action02Records[1].status).toBe('COMPLETED');

    const action03Records = auditRecords.filter((r) => r.action === 'ACTION_03');
    expect(action03Records.length).toBe(2);
    expect(action03Records[0].status).toBe('STARTED');
    expect(action03Records[1].status).toBe('COMPLETED');

    const action04Records = auditRecords.filter((r) => r.action === 'ACTION_04');
    expect(action04Records.length).toBe(2);
    expect(action04Records[0].status).toBe('STARTED');
    expect(action04Records[1].status).toBe('COMPLETED');

    const action05Records = auditRecords.filter((r) => r.action === 'ACTION_05');
    expect(action05Records.length).toBe(2);
    expect(action05Records[0].status).toBe('STARTED');
    expect(action05Records[1].status).toBe('COMPLETED');

    const action06Records = auditRecords.filter((r) => r.action === 'ACTION_06');
    expect(action06Records.length).toBe(2);
    expect(action06Records[0].status).toBe('STARTED');
    expect(action06Records[1].status).toBe('COMPLETED');

    expect(auditRecords.length).toBe(12);

    const timeSequence = auditRecords.map((r) => r.timestamp.getTime());
    for (let i = 1; i < timeSequence.length; i++) {
      expect(timeSequence[i]).toGreaterThanOrEqual(timeSequence[i - 1]);
    }
  });
});