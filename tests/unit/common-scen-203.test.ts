import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';
import type { Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('submission-status-management', () => {
  // SCEN-203: [error] 日報収集・確認・催促の自動化エージェント AIエージェント - escalation handoff before side effect confirmation
  test('SCEN-203: detectAndNotifyUnsubmitted triggers escalation handoff when duplicate issue detected before side effect confirmation', async () => {
    // Setup: Mock database with duplicate issue records
    const pastReports = [
      {
        reportId: 'rpt-001',
        memberId: 'member-001',
        submittedAt: new Date('2024-10-01T08:00:00Z'),
        issues: [{ id: 'iss-001', title: 'サーバーログイン遅延', category: 'infrastructure' }],
      },
      {
        reportId: 'rpt-002',
        memberId: 'member-002',
        submittedAt: new Date('2024-10-08T08:00:00Z'),
        issues: [{ id: 'iss-002', title: 'サーバーログイン遅延', category: 'infrastructure' }],
      },
      {
        reportId: 'rpt-003',
        memberId: 'member-001',
        submittedAt: new Date('2024-10-15T08:00:00Z'),
        issues: [{ id: 'iss-003', title: 'サーバーログイン遅延', category: 'infrastructure' }],
      },
      {
        reportId: 'rpt-004',
        memberId: 'member-003',
        submittedAt: new Date('2024-10-22T08:00:00Z'),
        issues: [{ id: 'iss-004', title: 'サーバーログイン遅延', category: 'infrastructure' }],
      },
      {
        reportId: 'rpt-005',
        memberId: 'member-002',
        submittedAt: new Date('2024-10-29T08:00:00Z'),
        issues: [{ id: 'iss-005', title: 'サーバーログイン遅延', category: 'infrastructure' }],
      },
    ];

    const unsubmittedMembers = [
      { memberId: 'member-004', email: 'member004@company.com', name: 'Member Four' },
      { memberId: 'member-005', email: 'member005@company.com', name: 'Member Five' },
    ];

    const managerEmail = 'manager@company.com';
    const executionTime = new Date('2024-11-05T09:00:00Z');

    // Setup: Mock AI client with escalation trigger
    const mockAiClient: Partial<Tx11Imp1AiClient> = {
      action05_prioritizeAndSummarize: async (input: {
        submittedReports: unknown[];
        duplicateIssueThreshold: number;
      }) => {
        const duplicateIssueCount = 5; // server login delay occurred 5 times
        return {
          summary: 'Daily report summary',
          prioritizedIssues: [
            {
              id: 'iss-dup-001',
              title: 'サーバーログイン遅延',
              priority: 'HIGH',
              occurrenceCount: duplicateIssueCount,
              shouldEscalate: duplicateIssueCount >= 3,
              proposedAction: '対応方針の見直し検討が必要',
            },
          ],
          escalationTriggered: true,
          escalationReason: 'duplicate_issue_threshold_exceeded',
        };
      },
      action06_distributeMorningMeetingSummary: async (input: {
        summary: unknown;
        recipientEmail: string;
        status: string;
      }) => {
        return {
          distributionId: 'dist-001',
          recipientEmail: input.recipientEmail as string,
          status: input.status as string,
          distributedAt: new Date('2024-11-05T09:30:00Z'),
        };
      },
    };

    // State tracker for side effects and handoff
    const auditLog: Array<{
      timestamp: Date;
      eventType: string;
      details: Record<string, unknown>;
    }> = [];

    const sideEffectTracker = {
      action06_executed: false,
      action06_confirmed: false,
      handoffTriggered: false,
      handoffNotificationSent: false,
      humanApprovalReceived: false,
    };

    // Mock: Capture escalation trigger before side effect
    const escalationHandler = async (escalationData: Record<string, unknown>) => {
      sideEffectTracker.handoffTriggered = true;
      auditLog.push({
        timestamp: new Date('2024-11-05T09:15:00Z'),
        eventType: 'escalation_triggered',
        details: escalationData,
      });

      // Handoff to human (manager)
      sideEffectTracker.handoffNotificationSent = true;
      auditLog.push({
        timestamp: new Date('2024-11-05T09:15:10Z'),
        eventType: 'handoff_to_human',
        details: {
          notificationTarget: managerEmail,
          escalationReason: 'duplicate_issue_threshold_exceeded',
          summaryStatus: 'pending_distribution',
          proposedAction: '対応方針の見直し検討が必要',
        },
      });
    };

    // Mock: Human approval callback
    const handleHumanApproval = async (approvalData: Record<string, unknown>) => {
      sideEffectTracker.humanApprovalReceived = true;
      auditLog.push({
        timestamp: new Date('2024-11-05T09:25:00Z'),
        eventType: 'human_approval_received',
        details: approvalData,
      });

      // Resume action 06
      sideEffectTracker.action06_executed = true;
      auditLog.push({
        timestamp: new Date('2024-11-05T09:25:30Z'),
        eventType: 'action_06_resumed_after_approval',
        details: {
          summary: 'Daily report with escalation proposal',
          recipientEmail: managerEmail,
        },
      });

      sideEffectTracker.action06_confirmed = true;
      auditLog.push({
        timestamp: new Date('2024-11-05T09:26:00Z'),
        eventType: 'side_effect_confirmed',
        details: {
          distributionId: 'dist-001',
          summaryIncludesProposal: true,
        },
      });
    };

    // Execute: Call detectAndNotifyUnsubmitted
    const result = await detectAndNotifyUnsubmitted({
      unsubmittedMembers,
      pastReports: pastReports as unknown[],
      managerEmail,
      aiClient: mockAiClient as Tx11Imp1AiClient,
      executionTime,
      onEscalation: escalationHandler,
      onHumanApproval: handleHumanApproval,
    });

    // Verify: Escalation triggered before action 06 side effect
    expect(sideEffectTracker.handoffTriggered).toBe(true);
    expect(sideEffectTracker.handoffNotificationSent).toBe(true);

    // Verify: Action 06 NOT executed before human approval
    const beforeApprovalAction06Event = auditLog.find(
      (evt) => evt.eventType === 'action_06_resumed_after_approval'
    );
    expect(beforeApprovalAction06Event).toBeUndefined();

    // Simulate: Human approval and action 06 resumption
    await handleHumanApproval({ approvalId: 'appr-001', approverEmail: managerEmail });

    // Verify: Action 06 executed after human approval
    expect(sideEffectTracker.humanApprovalReceived).toBe(true);
    expect(sideEffectTracker.action06_confirmed).toBe(true);

    // Verify: Audit log contains correct sequence of events
    const eventSequence = auditLog.map((evt) => evt.eventType);
    expect(eventSequence).toEqual([
      'escalation_triggered',
      'handoff_to_human',
      'human_approval_received',
      'action_06_resumed_after_approval',
      'side_effect_confirmed',
    ]);

    // Verify: Escalation details captured in audit log
    const escalationEvent = auditLog.find((evt) => evt.eventType === 'escalation_triggered');
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.details).toMatchObject({
      escalationReason: 'duplicate_issue_threshold_exceeded',
    });

    // Verify: Handoff notification details
    const handoffEvent = auditLog.find((evt) => evt.eventType === 'handoff_to_human');
    expect(handoffEvent).toBeDefined();
    expect(handoffEvent?.details.notificationTarget).toBe(managerEmail);
    expect(handoffEvent?.details.summaryStatus).toBe('pending_distribution');

    // Verify: Final audit event confirms side effect only after approval
    const finalEvent = auditLog[auditLog.length - 1];
    expect(finalEvent.eventType).toBe('side_effect_confirmed');
    expect(finalEvent.details.summaryIncludesProposal).toBe(true);

    // Verify: Result contains expected unsubmitted members and escalation info
    expect(result).toMatchObject({
      unsubmittedCount: 2,
      escalationDetected: true,
      escalationReason: 'duplicate_issue_threshold_exceeded',
      humanHandoffRequired: true,
      sideEffectConfirmed: false, // At return time, approval not yet processed
    });

    // Verify: Timestamps are in correct order
    const timestamps = auditLog.map((evt) => evt.timestamp.getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });
});