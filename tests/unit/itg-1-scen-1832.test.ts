import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/types';
import type { NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-1832: [edge] 月次レポート通知機能 - 生成されたレポートがプロジェクトマネージャー宛に通知される
  test('should send generated monthly report notification to project manager and record delivery log', async () => {
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-user-001';
    const reportId = 'rpt-2024-01-001';
    const deliveryTimestamp = new Date('2024-02-01T09:15:30Z');

    const notificationDeliveryLog: Array<{
      reportId: string;
      recipientUserId: string;
      notificationType: string;
      deliveryStatus: string;
      timestamp: Date;
    }> = [];

    const mockNotificationServiceAdapter: Partial<NotificationServiceAdapter> = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        messageId: 'msg-2024-01-001',
        deliveryTimestamp,
      }),
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(
      agentInput,
      mockNotificationServiceAdapter as NotificationServiceAdapter,
    );

    expect(result.reportId).toBe(reportId);
    expect(result.executionStatus).toBe('success');
    expect(result.deliveryTimestamp).toEqual(deliveryTimestamp);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: managerUserId,
        messageType: 'monthly_report',
        reportId,
        targetMonth,
      }),
    );

    const callArgs = (
      mockNotificationServiceAdapter.sendReminderNotification as jest.Mock
    ).mock.calls[0][0];

    notificationDeliveryLog.push({
      reportId: callArgs.reportId,
      recipientUserId: callArgs.userId,
      notificationType: 'monthly_report',
      deliveryStatus: 'SUCCESS',
      timestamp: deliveryTimestamp,
    });

    expect(notificationDeliveryLog).toHaveLength(1);
    expect(notificationDeliveryLog[0]).toEqual({
      reportId,
      recipientUserId: managerUserId,
      notificationType: 'monthly_report',
      deliveryStatus: 'SUCCESS',
      timestamp: deliveryTimestamp,
    });

    expect(result.analysisResultSummary).toBeDefined();
    expect(result.analysisResultSummary.topPriorityChallenges).toBeDefined();
    expect(result.analysisResultSummary.performanceMetrics).toBeDefined();
    expect(result.analysisResultSummary.bottleneckTrend).toBeDefined();
  });
});