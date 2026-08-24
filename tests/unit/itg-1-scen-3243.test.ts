import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type {
  Tx11AgentInput,
  Tx11AgentOutput,
  SubmissionStatusSummary,
  PrioritizedIssue,
} from '../../src/agents/tx-11-imp-1/orchestrator';

// Mock types for AI client interfaces
interface MockAiClientAction {
  actionName: string;
  params: Record<string, unknown>;
}

interface FakeTx11Imp1AiClient {
  executeAction(actionName: string, params: Record<string, unknown>): Promise<unknown>;
  getExecutedActions(): MockAiClientAction[];
  reset(): void;
}

// Mock types for external service adapters
interface NotificationRecord {
  recipientId: string;
  sentAt: Date;
  messageType: string;
  status: 'sent' | 'failed';
}

interface EscalationContext {
  unsubmittedMembers: string[];
  reminderSentCount: number;
  reminderTimestamps: Date[];
  memberLastAccessTimes: Record<string, Date>;
  recommendedAction: 'immediate_manager_notification' | 'adjust_reminder_rules' | 'extend_deadline';
  escalationTimestamp: Date;
  canRollback: boolean;
  rollbackData?: Record<string, unknown>;
}

interface HandoverHandler {
  onEscalation(context: EscalationContext): Promise<'proceed_with_notification' | 'adjust_rules' | 'cancel'>;
}

describe('tx-11-imp-1 orchestrator: AIエージェント - 催促後未提出時のエスカレーション', () => {
  // SCEN-3243
  test('催促3回後も未提出メンバーを検出し、副作用確定前に人間への引き継ぎを実行する', async () => {
    // Setup: fake AI client
    const executedActions: MockAiClientAction[] = [];
    const fakeAiClient: FakeTx11Imp1AiClient = {
      executeAction: jest.fn(async (actionName: string, params: Record<string, unknown>) => {
        executedActions.push({ actionName, params });
        // Simulate AI responses for each action
        switch (actionName) {
          case 'checkSubmissionStatus':
            return {
              totalMembers: 5,
              submittedCount: 3,
              unsubmittedMembers: ['member-a', 'member-b'],
            };
          case 'getReminderHistory':
            return {
              'member-a': {
                sendCount: 3,
                timestamps: [
                  new Date('2024-01-15T08:00:00Z'),
                  new Date('2024-01-15T08:15:00Z'),
                  new Date('2024-01-15T08:30:00Z'),
                ],
                lastAccessTime: new Date('2024-01-15T09:30:00Z'),
              },
              'member-b': {
                sendCount: 3,
                timestamps: [
                  new Date('2024-01-15T08:00:00Z'),
                  new Date('2024-01-15T08:15:00Z'),
                  new Date('2024-01-15T08:30:00Z'),
                ],
                lastAccessTime: new Date('2024-01-15T08:00:00Z'),
              },
            };
          case 'extractIssues':
            return {
              issues: [
                { keyword: 'performance_issue', frequency: 2, impactScore: 45 },
              ],
              extractedAt: new Date('2024-01-15T10:00:00Z'),
            };
          case 'assessEscalationCondition':
            return {
              escalationTriggered: true,
              condition: 'reminder_exhausted',
              unsubmittedMembers: ['member-a', 'member-b'],
              reminderAttempts: 3,
              recommendedAction: 'immediate_manager_notification',
            };
          case 'prepareEscalationContext':
            return {
              unsubmittedMembers: ['member-a', 'member-b'],
              reminderSentCount: 3,
              reminderTimestamps: [
                new Date('2024-01-15T08:00:00Z'),
                new Date('2024-01-15T08:15:00Z'),
                new Date('2024-01-15T08:30:00Z'),
              ],
              memberLastAccessTimes: {
                'member-a': new Date('2024-01-15T09:30:00Z'),
                'member-b': new Date('2024-01-15T08:00:00Z'),
              },
              recommendedAction: 'immediate_manager_notification',
              canRollback: true,
              rollbackData: {
                sentNotifications: [],
                generatedReports: [],
              },
            };
          default:
            return {};
        }
      }),
      getExecutedActions: jest.fn(() => executedActions),
      reset: jest.fn(() => {
        executedActions.length = 0;
      }),
    };

    // Setup: handover handler to capture escalation context
    let capturedEscalationContext: EscalationContext | null = null;
    let handoverDecision: 'proceed_with_notification' | 'adjust_rules' | 'cancel' = 'cancel';
    const handoverHandler: HandoverHandler = {
      onEscalation: jest.fn(async (context: EscalationContext) => {
        capturedEscalationContext = context;
        return handoverDecision;
      }),
    };

    // Input: execution context with unsubmitted members after 3 reminder attempts
    const agentInput: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
      teamId: 'team-001',
      reportDeadlineTime: '09:00',
      managerEmail: 'manager@example.com',
    };

    // Execute agent with injected fake AI client
    const result: Tx11AgentOutput = await runTx11Imp1Agent(agentInput, fakeAiClient as any);

    // Verify escalation detection
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('partial_failure');

    // Verify unsubmitted members detected
    expect(result.submissionStatus.unsubmittedMembers).toContain('member-a');
    expect(result.submissionStatus.unsubmittedMembers).toContain('member-b');
    expect(result.submissionStatus.unsubmittedMembers.length).toBe(2);

    // Verify escalation context was prepared before side effect
    expect(capturedEscalationContext).not.toBeNull();
    expect(capturedEscalationContext!.unsubmittedMembers).toEqual(['member-a', 'member-b']);
    expect(capturedEscalationContext!.reminderSentCount).toBe(3);
    expect(capturedEscalationContext!.recommendedAction).toBe('immediate_manager_notification');

    // Verify member access times recorded
    expect(capturedEscalationContext!.memberLastAccessTimes['member-a']).toEqual(
      new Date('2024-01-15T09:30:00Z')
    );
    expect(capturedEscalationContext!.memberLastAccessTimes['member-b']).toEqual(
      new Date('2024-01-15T08:00:00Z')
    );

    // Verify rollback capability
    expect(capturedEscalationContext!.canRollback).toBe(true);
    expect(capturedEscalationContext!.rollbackData).toBeDefined();

    // Verify manager summary email was NOT sent (side effect held)
    expect(result.summaryEmailSent).toBe(false);

    // Verify reminder notifications were sent for previous attempts
    expect(result.notificationsSent.length).toBe(3);
    expect(result.notificationsSent[0].sentAt).toEqual(new Date('2024-01-15T08:00:00Z'));
    expect(result.notificationsSent[1].sentAt).toEqual(new Date('2024-01-15T08:15:00Z'));
    expect(result.notificationsSent[2].sentAt).toEqual(new Date('2024-01-15T08:30:00Z'));

    // Verify AI actions executed in correct sequence
    const actionNames = executedActions.map(a => a.actionName);
    expect(actionNames).toContain('checkSubmissionStatus');
    expect(actionNames).toContain('getReminderHistory');
    expect(actionNames).toContain('assessEscalationCondition');
    expect(actionNames).toContain('prepareEscalationContext');

    // Verify handover was invoked
    expect(handoverHandler.onEscalation).toHaveBeenCalled();
    expect(handoverHandler.onEscalation).toHaveBeenCalledWith(
      expect.objectContaining({
        unsubmittedMembers: ['member-a', 'member-b'],
        reminderSentCount: 3,
        canRollback: true,
      })
    );

    // Scenario: Human decision 1 - Cancel escalation
    handoverDecision = 'cancel';
    const cancelResult = await runTx11Imp1Agent(agentInput, fakeAiClient as any);
    expect(cancelResult.summaryEmailSent).toBe(false);
    expect(cancelResult.executionStatus).toBe('partial_failure');

    // Scenario: Human decision 2 - Adjust reminder rules (hold side effect)
    handoverDecision = 'adjust_rules';
    const adjustRulesResult = await runTx11Imp1Agent(agentInput, fakeAiClient as any);
    expect(adjustRulesResult.summaryEmailSent).toBe(false);

    // Scenario: Human decision 3 - Proceed with manager notification (execute side effect)
    handoverDecision = 'proceed_with_notification';
    const proceedResult = await runTx11Imp1Agent(agentInput, fakeAiClient as any);
    // Only in this case should manager notification be sent
    // (actual implementation will set summaryEmailSent = true on proceed)
  });
});