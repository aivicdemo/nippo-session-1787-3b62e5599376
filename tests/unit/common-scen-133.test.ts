import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';

// Mock types matching Tx7Imp1AiClient interface
interface Action2Response {
  status: 'error' | 'success';
  errorCode?: string;
  errorMessage?: string;
  inconsistencyDetails?: {
    field: string;
    expectedFormat: string;
    actualValue: string;
  }[];
  extractedData?: unknown;
}

interface AuditLogEntry {
  timestamp: Date;
  eventType: string;
  agentId: string;
  escalationReason?: string;
  agentState?: string;
}

interface HandoffNotification {
  errorContent: string;
  occurredAt: string;
  validationResult: {
    field: string;
    expectedFormat: string;
    actualValue: string;
  }[];
  managerNotificationStatus: string;
}

interface Tx7Imp1AiClient {
  executeAction01(input: object): Promise<{ status: string }>;
  executeAction02(input: object): Promise<Action2Response>;
  executeAction03(input: object): Promise<{ status: string }>;
  executeAction04(input: object): Promise<{ status: string }>;
  executeAction05(input: object): Promise<{ status: string }>;
  executeAction06(input: object): Promise<{ status: string }>;
  executeAction07(input: object): Promise<{ status: string }>;
  executeAction08(input: object): Promise<{ status: string }>;
}

describe('tx-7-imp-1 orchestrator: Data extraction inconsistency escalation', () => {
  let mockAiClient: Tx7Imp1AiClient;
  let auditLog: AuditLogEntry[] = [];
  let handoffNotifications: HandoffNotification[] = [];
  let executedActions: string[] = [];

  beforeEach(() => {
    auditLog = [];
    handoffNotifications = [];
    executedActions = [];

    mockAiClient = {
      executeAction01: jest.fn(async (input: object) => {
        executedActions.push('Action01');
        return { status: 'success' };
      }),

      executeAction02: jest.fn(async (input: object) => {
        executedActions.push('Action02');
        // Simulate data extraction inconsistency error
        return {
          status: 'error',
          errorCode: 'DATA_EXTRACTION_INCONSISTENCY',
          errorMessage: 'Data inconsistency detected in extracted report data',
          inconsistencyDetails: [
            {
              field: 'reportDate',
              expectedFormat: 'YYYY-MM-DD',
              actualValue: 'invalid-date-format'
            },
            {
              field: 'teamId',
              expectedFormat: 'string UUID',
              actualValue: 'null'
            }
          ]
        };
      }),

      executeAction03: jest.fn(async (input: object) => {
        executedActions.push('Action03');
        return { status: 'success' };
      }),

      executeAction04: jest.fn(async (input: object) => {
        executedActions.push('Action04');
        return { status: 'success' };
      }),

      executeAction05: jest.fn(async (input: object) => {
        executedActions.push('Action05');
        return { status: 'success' };
      }),

      executeAction06: jest.fn(async (input: object) => {
        executedActions.push('Action06');
        return { status: 'success' };
      }),

      executeAction07: jest.fn(async (input: object) => {
        executedActions.push('Action07');
        return { status: 'success' };
      }),

      executeAction08: jest.fn(async (input: object) => {
        executedActions.push('Action08');
        return { status: 'success' };
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-133
  test('should escalate to human when data extraction inconsistency occurs and halt side effects', async () => {
    const mockHandoffHandler = jest.fn(
      async (escalationInfo: {
        errorContent: string;
        occurredAt: string;
        validationResult: Array<{ field: string; expectedFormat: string; actualValue: string }>;
        managerNotificationStatus: string;
      }) => {
        handoffNotifications.push({
          errorContent: escalationInfo.errorContent,
          occurredAt: escalationInfo.occurredAt,
          validationResult: escalationInfo.validationResult,
          managerNotificationStatus: escalationInfo.managerNotificationStatus
        });

        auditLog.push({
          timestamp: new Date('2024-01-15T09:00:00Z'),
          eventType: 'ESCALATION',
          agentId: 'tx-7-imp-1-agent',
          escalationReason: 'DATA_EXTRACTION_INCONSISTENCY',
          agentState: 'HANDOFF_TO_HUMAN'
        });
      }
    );

    const targetMonth = '2024-01';
    const teamId = 'team-001';
    const input = {
      targetMonth,
      teamId,
      triggeredBy: 'schedule' as const
    };

    try {
      await runTx7Imp1Agent(input, mockAiClient, mockHandoffHandler);
    } catch (error) {
      // Expected: function may throw or return escalation state
    }

    // Verify Action 1 and Action 2 were executed
    expect(executedActions).toContain('Action01');
    expect(executedActions).toContain('Action02');

    // Verify Action 3 onwards were NOT executed (side effects halted)
    expect(executedActions).not.toContain('Action03');
    expect(executedActions).not.toContain('Action04');
    expect(executedActions).not.toContain('Action05');
    expect(executedActions).not.toContain('Action06');
    expect(executedActions).not.toContain('Action07');
    expect(executedActions).not.toContain('Action08');

    // Verify handoff to human occurred
    expect(mockHandoffHandler).toHaveBeenCalled();
    expect(handoffNotifications).toHaveLength(1);

    // Verify handoff notification contains correct escalation information
    const notification = handoffNotifications[0];
    expect(notification.errorContent).toBe('データ不整合検出');
    expect(notification.occurredAt).toBe('Action 2：当月蓄積報告データ抽出');
    expect(notification.validationResult).toEqual([
      {
        field: 'reportDate',
        expectedFormat: 'YYYY-MM-DD',
        actualValue: 'invalid-date-format'
      },
      {
        field: 'teamId',
        expectedFormat: 'string UUID',
        actualValue: 'null'
      }
    ]);
    expect(notification.managerNotificationStatus).toBe('未通知');

    // Verify audit log recorded escalation event
    expect(auditLog).toHaveLength(1);
    const auditEntry = auditLog[0];
    expect(auditEntry.eventType).toBe('ESCALATION');
    expect(auditEntry.agentId).toBe('tx-7-imp-1-agent');
    expect(auditEntry.escalationReason).toBe('DATA_EXTRACTION_INCONSISTENCY');
    expect(auditEntry.agentState).toBe('HANDOFF_TO_HUMAN');
    expect(auditEntry.timestamp).toEqual(new Date('2024-01-15T09:00:00Z'));

    // Verify side effects are NOT confirmed
    // No report generated, no analysis presented, no prioritization completed
    expect(executedActions.length).toBe(2); // Only Action01 and Action02 executed
  });
});