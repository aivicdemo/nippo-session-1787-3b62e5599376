import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-081: sendUnsubmittedReminder escalates when economic impact exceeds threshold', async () => {
    const unsubmittedMembers = [
      {
        userId: 'user-001',
        name: 'Alice',
        email: 'alice@example.com',
        teamId: 'team-001',
        escalationLevel: 0,
      },
      {
        userId: 'user-002',
        name: 'Bob',
        email: 'bob@example.com',
        teamId: 'team-001',
        escalationLevel: 0,
      },
    ];

    const escalationThreshold = 50000;
    const estimatedEconomicImpactYen = 75000;

    const mockAuditLog: Array<{
      timestamp: string;
      eventType: string;
      reviewRequired: boolean;
      escalationReason?: string;
      managerId?: string;
      escalationTimestamp?: string;
    }> = [];

    const mockNotificationHistory: Array<{
      userId: string;
      sentAt: string;
      reminderLevel: number;
    }> = [];

    const result = await sendUnsubmittedReminder(
      unsubmittedMembers,
      {
        escalationThreshold,
        estimatedEconomicImpactYen,
        managerId: 'manager-001',
        auditLog: mockAuditLog,
        notificationHistory: mockNotificationHistory,
      },
    );

    expect(result.reviewRequired).toBe(true);
    expect(result.escalationReason).toBe('economic_impact_exceeds_threshold');
    expect(result.actionSuspended).toBe(true);

    const auditEntry = mockAuditLog[mockAuditLog.length - 1];
    expect(auditEntry).toBeDefined();
    expect(auditEntry.eventType).toBe('escalation_triggered');
    expect(auditEntry.reviewRequired).toBe(true);
    expect(auditEntry.escalationReason).toBe('economic_impact_exceeds_threshold');
    expect(auditEntry.managerId).toBe('manager-001');
    expect(auditEntry.escalationTimestamp).toBeDefined();

    expect(mockNotificationHistory.length).toBe(0);
    expect(result.remindersSent).toBe(0);
    expect(result.actionsExecuted).toEqual([]);
  });
});