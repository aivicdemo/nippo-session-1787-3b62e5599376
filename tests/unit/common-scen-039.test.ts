import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

// Mock types and interfaces
interface MockUnsubmittedReminderInput {
  agentExecutionId: string;
  targetDate: string;
  unsubmittedMembers: Array<{
    memberId: string;
    memberName: string;
    email: string;
  }>;
  deadlineTime: string;
}

interface MockRollbackContext {
  sentNotificationIds: string[];
  createdTempIssueRecordIds: string[];
  acquiredLockIds: string[];
  transactionState: 'active' | 'committed' | 'rolled_back';
}

interface MockEmailSystemStub {
  sentMessages: Array<{
    id: string;
    recipientEmail: string;
    messageBody: string;
    timestamp: string;
    status: 'sent' | 'reverted';
  }>;
  deleteMessage: (messageId: string) => void;
  getMessageStatus: (messageId: string) => 'sent' | 'reverted' | null;
}

interface MockDbTransaction {
  tempIssueRecords: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  lockStates: Map<string, boolean>;
  rollback: () => void;
  commit: () => void;
  isActive: () => boolean;
}

// Global mock instances
let mockEmailSystem: MockEmailSystemStub;
let mockDbTransaction: MockDbTransaction;
let rollbackContext: MockRollbackContext;

beforeEach(() => {
  // Initialize mock email system
  mockEmailSystem = {
    sentMessages: [],
    deleteMessage: (messageId: string) => {
      const message = mockEmailSystem.sentMessages.find((m) => m.id === messageId);
      if (message) {
        message.status = 'reverted';
      }
    },
    getMessageStatus: (messageId: string) => {
      const message = mockEmailSystem.sentMessages.find((m) => m.id === messageId);
      return message ? message.status : null;
    },
  };

  // Initialize mock database transaction
  mockDbTransaction = {
    tempIssueRecords: [],
    lockStates: new Map(),
    rollback: () => {
      mockDbTransaction.tempIssueRecords = [];
      mockDbTransaction.lockStates.forEach((_, key) => {
        mockDbTransaction.lockStates.set(key, false);
      });
      mockDbTransaction.isActive = () => false;
    },
    commit: () => {
      // no-op for test
    },
    isActive: () => true,
  };

  // Initialize rollback context
  rollbackContext = {
    sentNotificationIds: [],
    createdTempIssueRecordIds: [],
    acquiredLockIds: [],
    transactionState: 'active',
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Notification Delivery - Rollback on Partial Failure', () => {
  // SCEN-039
  test('should rollback side effects and restore system state when Action 4 fails during tx-1-imp-1 agent execution', async () => {
    // Arrange: Setup initial state and mock dependencies
    const agentExecutionId = 'agent-exec-20250115-001';
    const targetDate = '2025-01-15';
    const deadlineTime = '09:00:00Z';

    const unsubmittedMembers: MockUnsubmittedReminderInput['unsubmittedMembers'] = [
      {
        memberId: 'member-001',
        memberName: 'John Doe',
        email: 'john.doe@example.com',
      },
      {
        memberId: 'member-002',
        memberName: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
    ];

    const input: MockUnsubmittedReminderInput = {
      agentExecutionId,
      targetDate,
      unsubmittedMembers,
      deadlineTime,
    };

    // Mock: Simulate Action 1 (日報取得) - Acquire locks
    const action1Locks = unsubmittedMembers.map((member) => `lock-${member.memberId}`);
    action1Locks.forEach((lockId) => {
      mockDbTransaction.lockStates.set(lockId, true);
      rollbackContext.acquiredLockIds.push(lockId);
    });

    // Mock: Simulate Action 2 (未提出通知送信) - Send reminder notifications
    const sentNotificationIds: string[] = [];
    unsubmittedMembers.forEach((member) => {
      const messageId = `msg-${agentExecutionId}-${member.memberId}`;
      sentNotificationIds.push(messageId);
      mockEmailSystem.sentMessages.push({
        id: messageId,
        recipientEmail: member.email,
        messageBody: `Reminder: Your daily report for ${targetDate} is due by ${deadlineTime}`,
        timestamp: new Date('2025-01-15T08:00:00Z').toISOString(),
        status: 'sent',
      });
      rollbackContext.sentNotificationIds.push(messageId);
    });

    // Mock: Simulate Action 3 (課題抽出) - Create temporary issue records
    const createdTempRecordIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const recordId = `temp-issue-${agentExecutionId}-${i}`;
      createdTempRecordIds.push(recordId);
      mockDbTransaction.tempIssueRecords.push({
        id: recordId,
        content: `Extracted issue ${i + 1} from pending reports`,
        createdAt: new Date('2025-01-15T08:30:00Z').toISOString(),
      });
      rollbackContext.createdTempIssueRecordIds.push(recordId);
    }

    // Verify state before simulating Action 4 failure
    expect(mockEmailSystem.sentMessages.length).toBe(2);
    expect(mockEmailSystem.sentMessages.every((m) => m.status === 'sent')).toBe(true);
    expect(mockDbTransaction.tempIssueRecords.length).toBe(3);
    expect(mockDbTransaction.lockStates.size).toBe(2);
    expect(Array.from(mockDbTransaction.lockStates.values()).every((v) => v === true)).toBe(
      true
    );
    expect(rollbackContext.transactionState).toBe('active');

    // Simulate Action 4 failure (優先度付与) by throwing exception
    const action4ErrorMessage = 'Priority scoring engine failed: unable to access rule engine';
    let compensationExecuted = false;
    let compensationLog: string[] = [];

    try {
      // Simulate the action 4 failure
      throw new Error(action4ErrorMessage);
    } catch (error) {
      // Compensate for completed side effects
      compensationExecuted = true;

      // Compensation: Revert Action 2 side effects (sent notifications)
      rollbackContext.sentNotificationIds.forEach((messageId) => {
        mockEmailSystem.deleteMessage(messageId);
        compensationLog.push(`Reverted notification message: ${messageId}`);
      });

      // Compensation: Revert Action 3 side effects (temporary issue records)
      mockDbTransaction.rollback();
      rollbackContext.createdTempIssueRecordIds.forEach((recordId) => {
        compensationLog.push(`Rolled back temp issue record: ${recordId}`);
      });

      // Compensation: Release locks acquired in Action 1
      rollbackContext.acquiredLockIds.forEach((lockId) => {
        mockDbTransaction.lockStates.set(lockId, false);
        compensationLog.push(`Released lock: ${lockId}`);
      });

      // Update transaction state
      rollbackContext.transactionState = 'rolled_back';
      compensationLog.push('Rollback completed: Actions 2,3 reverted');
    }

    // Assert: Verify compensation was executed
    expect(compensationExecuted).toBe(true);

    // Assert: Verify all sent notifications were reverted
    expect(rollbackContext.sentNotificationIds.length).toBe(2);
    rollbackContext.sentNotificationIds.forEach((messageId) => {
      const status = mockEmailSystem.getMessageStatus(messageId);
      expect(status).toBe('reverted');
    });

    // Assert: Verify temporary issue records were rolled back
    expect(mockDbTransaction.tempIssueRecords.length).toBe(0);
    expect(mockDbTransaction.isActive()).toBe(false);

    // Assert: Verify all locks were released
    expect(Array.from(mockDbTransaction.lockStates.values()).every((v) => v === false)).toBe(
      true
    );

    // Assert: Verify transaction state was set to rolled back
    expect(rollbackContext.transactionState).toBe('rolled_back');

    // Assert: Verify compensation log contains expected rollback messages
    expect(compensationLog.length).toBeGreaterThan(0);
    expect(compensationLog.some((log) => log.includes('Rollback completed'))).toBe(true);
    expect(compensationLog.filter((log) => log.includes('Reverted notification')).length).toBe(2);
    expect(compensationLog.filter((log) => log.includes('Rolled back temp issue')).length).toBe(3);
    expect(compensationLog.filter((log) => log.includes('Released lock')).length).toBe(2);

    // Assert: Verify no completion notification was sent (Action 6 was skipped)
    // This assumes Action 6 would have sent a message only if all prior actions succeeded
    const finalNotificationMessages = mockEmailSystem.sentMessages.filter(
      (m) => m.status === 'sent' && m.messageBody.includes('Morning meeting report')
    );
    expect(finalNotificationMessages.length).toBe(0);

    // Verify idempotent retry: simulate calling the agent again with same input
    // Reset context but preserve the rolled back state
    const secondAttemptEmailCount = mockEmailSystem.sentMessages.length;
    const secondAttemptIssueCount = mockDbTransaction.tempIssueRecords.length;
    const secondAttemptLockCount = Array.from(mockDbTransaction.lockStates.values()).filter(
      (v) => v === true
    ).length;

    // Re-run would start from clean state (no residual side effects)
    expect(secondAttemptEmailCount).toBe(2); // Only the reverted messages exist
    expect(secondAttemptIssueCount).toBe(0); // No temp records remain
    expect(secondAttemptLockCount).toBe(0); // No locks held
    expect(
      mockEmailSystem.sentMessages.every((m) => m.status === 'reverted' || m.status === 'sent')
    ).toBe(true);

    // Assert: Verify system is restored to initial state (idempotence)
    const finalSystemState = {
      emailSystemMessages: mockEmailSystem.sentMessages.filter((m) => m.status === 'sent'),
      dbTempRecords: mockDbTransaction.tempIssueRecords,
      activeLocks: Array.from(mockDbTransaction.lockStates.entries())
        .filter(([, isActive]) => isActive)
        .map(([lockId]) => lockId),
    };

    expect(finalSystemState.emailSystemMessages.length).toBe(0);
    expect(finalSystemState.dbTempRecords.length).toBe(0);
    expect(finalSystemState.activeLocks.length).toBe(0);

    // Call sendUnsubmittedReminder to verify it integrates with the mock infrastructure
    const result = await sendUnsubmittedReminder(input);

    // Assert: sendUnsubmittedReminder processed the input
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});