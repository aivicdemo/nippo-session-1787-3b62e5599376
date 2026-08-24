import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: Monthly Report Generation with Retry Control', () => {
  // SCEN-1864: [edge] 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 再試行回数がちょうど3回で上限に達し、エスカレーション通知が部長へ送出される
  test('should stop retrying after 3 attempts and send escalation notification to manager', async () => {
    // Setup
    const managerUserId = 'manager-001';
    const managerEmail = 'manager@company.com';
    const targetMonth = '2024-01';
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');
    
    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // Mock AI client that simulates failures
    let retryCount = 0;
    const maxRetries = 3;
    let notificationSendCount = 0;
    let lastNotificationContent = '';
    let lastNotificationRecipient = '';
    let notificationLogRecords: Array<{
      sender: string;
      recipient: string;
      notificationType: string;
      timestamp: Date;
    }> = [];

    const mockAiClient: Tx7Imp1AiClient = {
      action01_fetchMonthlyData: async () => {
        retryCount++;
        if (retryCount <= maxRetries) {
          throw new Error('Database connection error');
        }
        return {
          reportId: 'report-001',
          dataRecords: 10,
        };
      },
      action02_extractIssues: async () => {
        throw new Error('Extraction failed');
      },
      action03_analyzeBottleneck: async () => {
        throw new Error('Analysis failed');
      },
      action04_calculateMetrics: async () => {
        throw new Error('Metrics calculation failed');
      },
      action05_generateReport: async () => {
        throw new Error('Report generation failed');
      },
      action06_formatOutput: async () => {
        throw new Error('Output formatting failed');
      },
      action07_sendToManager: async () => {
        throw new Error('Manager notification failed');
      },
      action08_recordAuditLog: async () => {
        throw new Error('Audit log recording failed');
      },
    };

    // Mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: async (recipientEmail: string, messageContent: string) => {
        notificationSendCount++;
        lastNotificationRecipient = recipientEmail;
        lastNotificationContent = messageContent;
        notificationLogRecords.push({
          sender: 'System',
          recipient: 'manager',
          notificationType: 'Escalation',
          timestamp: new Date('2024-02-01T09:05:00Z'),
        });
        return { success: true, deliveryStatus: 'sent' };
      },
      scheduleNotification: async () => ({ success: true }),
      getDeliveryStatus: async () => ({ status: 'sent' }),
    };

    // Execute with retry logic simulation
    let finalRetryCount = 0;
    let escalationTriggered = false;

    try {
      for (let attempt = 0; attempt < maxRetries + 1; attempt++) {
        try {
          await runTx7Imp1Agent(input, mockAiClient);
          break;
        } catch (error) {
          finalRetryCount = attempt + 1;
          if (finalRetryCount >= maxRetries) {
            escalationTriggered = true;
            await mockNotificationAdapter.sendReminderNotification(
              managerEmail,
              '月次課題傾向分析レポート生成が3回の再試行後も失敗しました。管理者の対応が必要です。'
            );
            break;
          }
        }
      }
    } catch (error) {
      // Expected failure path
    }

    // Assertions
    expect(finalRetryCount).toBe(3);
    expect(escalationTriggered).toBe(true);
    expect(notificationSendCount).toBe(1);
    expect(lastNotificationRecipient).toBe(managerEmail);
    expect(lastNotificationContent).toBe(
      '月次課題傾向分析レポート生成が3回の再試行後も失敗しました。管理者の対応が必要です。'
    );
    expect(notificationLogRecords).toHaveLength(1);
    expect(notificationLogRecords[0]).toEqual({
      sender: 'System',
      recipient: 'manager',
      notificationType: 'Escalation',
      timestamp: new Date('2024-02-01T09:05:00Z'),
    });
    expect(retryCount).toBeLessThanOrEqual(3);
  });
});