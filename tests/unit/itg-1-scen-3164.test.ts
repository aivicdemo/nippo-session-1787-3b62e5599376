import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

// SCEN-3164: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント
// 未提出メンバーへのリマインド通知送信が契約どおり実行される

describe('tx-6-imp-1 orchestrator - Weekly report analysis agent', () => {
  test('should execute Action 2 to identify unreported members and send reminder notifications as per contract', async () => {
    // ============================================================
    // 1. Stub NotificationServiceAdapter for reminder notifications
    // ============================================================
    const sentNotifications: Array<{
      memberId: string;
      message: string;
      timestamp: Date;
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (memberId: string, message: string) => {
        sentNotifications.push({
          memberId,
          message,
          timestamp: new Date('2024-01-08T09:00:00Z'),
        });
        return {
          success: true,
          notificationId: `notif_${memberId}_${Date.now()}`,
          deliveryStatus: 'sent' as const,
          sentAt: new Date('2024-01-08T09:00:00Z'),
        };
      }),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'delivered' })),
    };

    // ============================================================
    // 2. Test data: Previous week (Mon 2024-01-01 to Sun 2024-01-07)
    // 10 members total: 7 submitted, 3 unreported
    // ============================================================
    const submittedMembers = [
      { memberId: 'member1', name: 'Alice', submittedAt: new Date('2024-01-05T08:15:00Z') },
      { memberId: 'member2', name: 'Bob', submittedAt: new Date('2024-01-05T08:20:00Z') },
      { memberId: 'member3', name: 'Charlie', submittedAt: new Date('2024-01-05T08:25:00Z') },
      { memberId: 'member4', name: 'Diana', submittedAt: new Date('2024-01-05T08:30:00Z') },
      { memberId: 'member5', name: 'Eve', submittedAt: new Date('2024-01-05T08:35:00Z') },
      { memberId: 'member6', name: 'Frank', submittedAt: new Date('2024-01-05T08:40:00Z') },
      { memberId: 'member7', name: 'Grace', submittedAt: new Date('2024-01-05T08:45:00Z') },
    ];

    const unreportedMembers = [
      { memberId: 'memberA', name: 'Henry' },
      { memberId: 'memberB', name: 'Iris' },
      { memberId: 'memberC', name: 'Jack' },
    ];

    const reportData = {
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-07',
      teamId: 'team_engineering',
      executionTimestamp: new Date('2024-01-08T09:00:00Z'),
      reportingPeriod: {
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-07T23:59:59Z'),
      },
      submittedReports: submittedMembers.map((member) => ({
        memberId: member.memberId,
        memberName: member.name,
        submittedAt: member.submittedAt,
        content: {
          yesterday: `Completed work item for ${member.name}`,
          today: `Scheduled work item for ${member.name}`,
          issues: `Issue encountered by ${member.name}`,
        },
      })),
      unreportedMembers: unreportedMembers.map((member) => ({
        memberId: member.memberId,
        memberName: member.name,
      })),
    };

    // ============================================================
    // 3. Mock Tx6Imp1AiClient with Action 2 execution capability
    // ============================================================
    const mockAiClient: Partial<Tx6Imp1AiClient> = {
      executeAction: jest.fn(async (actionNumber: number, promptContent: string) => {
        if (actionNumber === 2) {
          // Action 2: Identify unreported members and prepare reminder notifications
          return {
            actionNumber: 2,
            status: 'completed',
            unreportedMemberIds: ['memberA', 'memberB', 'memberC'],
            reminderMessage: 'Previous week daily report not yet submitted. Please submit by this morning.',
            shouldProceedToNextAction: true,
          };
        }
        return { actionNumber, status: 'skipped' };
      }),
    };

    // ============================================================
    // 4. Execute runTx6Imp1Agent with mocked dependencies
    // ============================================================
    const agentResult = await runTx6Imp1Agent(
      {
        executionTimestamp: new Date('2024-01-08T09:00:00Z'),
        analysisStartDate: '2024-01-01',
        analysisEndDate: '2024-01-07',
        teamId: 'team_engineering',
        targetTeamIds: ['team_engineering'],
        recipientManagerIds: ['manager_001'],
        reportData,
      },
      mockAiClient as Tx6Imp1AiClient,
      notificationServiceAdapterStub as any
    );

    // ============================================================
    // 5. Verify Action 2 execution and reminder notification sending
    // ============================================================
    expect(mockAiClient.executeAction).toHaveBeenCalledWith(
      2,
      expect.stringContaining('unreported')
    );

    // ============================================================
    // 6. Verify reminder notifications sent to all 3 unreported members
    // ============================================================
    expect(sentNotifications).toHaveLength(3);

    const sentMemberIds = sentNotifications.map((n) => n.memberId).sort();
    expect(sentMemberIds).toEqual(['memberA', 'memberB', 'memberC']);

    // Verify each notification contains the expected message
    sentNotifications.forEach((notification) => {
      expect(notification.message).toMatch(/日報提出/);
      expect(notification.timestamp).toEqual(new Date('2024-01-08T09:00:00Z'));
    });

    // ============================================================
    // 7. Verify adapter stub was called exactly 3 times (one per member)
    // ============================================================
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(3);

    notificationServiceAdapterStub.sendReminderNotification.mock.calls.forEach((call, idx) => {
      const [memberId, message] = call;
      expect(['memberA', 'memberB', 'memberC']).toContain(memberId);
      expect(message).toBeTruthy();
    });

    // ============================================================
    // 8. Verify agent result contains Action 2 execution summary
    // ============================================================
    expect(agentResult).toBeDefined();
    expect(agentResult.executionStatus).toBe('success');

    // Verify action 2 result is recorded in execution result
    if (agentResult.action02Result) {
      expect(agentResult.action02Result.unreportedMemberCount).toBe(3);
      expect(agentResult.action02Result.reminderNotificationsSent).toBe(3);
      expect(agentResult.action02Result.notificationStatus).toMatch(/成功/);
    }

    // ============================================================
    // 9. Verify notification delivery log records all sent notifications
    // ============================================================
    expect(agentResult.notificationDeliveryLog).toBeDefined();
    if (agentResult.notificationDeliveryLog) {
      expect(agentResult.notificationDeliveryLog.length).toBe(3);

      const loggedMemberIds = agentResult.notificationDeliveryLog.map((log) => log.memberId).sort();
      expect(loggedMemberIds).toEqual(['memberA', 'memberB', 'memberC']);

      agentResult.notificationDeliveryLog.forEach((log) => {
        expect(log.deliveryStatus).toBe('sent');
        expect(log.sentAt).toBeDefined();
      });
    }
  });
});