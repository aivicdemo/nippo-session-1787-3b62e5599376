import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import { ACTION_02_PROMPT_VERSION, buildAction02Prompt } from '../../src/agents/tx-9-imp-1/prompts/action-02';

describe('日報集約から分析報告までの自動実行エージェント - Action 2 未提出メンバー催促', () => {
  test('SCEN-3217: 未提出メンバーI・J（2名）を特定し催促通知を送信する', async () => {
    // Setup: サンプル日報データ (8名提出済み、2名未提出)
    const aggregationPeriodStart = new Date('2024-01-08T00:00:00Z');
    const aggregationPeriodEnd = new Date('2024-01-14T23:59:59Z');
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-001';

    const submittedMembers = [
      { memberId: 'member-A', name: 'Alice' },
      { memberId: 'member-B', name: 'Bob' },
      { memberId: 'member-C', name: 'Charlie' },
      { memberId: 'member-D', name: 'David' },
      { memberId: 'member-E', name: 'Eve' },
      { memberId: 'member-F', name: 'Frank' },
      { memberId: 'member-G', name: 'Grace' },
      { memberId: 'member-H', name: 'Henry' },
    ];

    const unsubmittedMembers = [
      { memberId: 'member-I', name: 'Iris' },
      { memberId: 'member-J', name: 'Jack' },
    ];

    // Setup: NotificationServiceAdapter のスタブ
    const notificationSendCalls: Array<{
      memberId: string;
      message: string;
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (memberId: string, message: string) => {
        notificationSendCalls.push({ memberId, message });
        return { status: 'success' as const, deliveryId: `delivery-${Date.now()}` };
      }),
      scheduleNotification: jest.fn(async () => ({ status: 'success' as const })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'success' as const })),
    };

    // Setup: 監査ログ記録用
    const auditLogs: Array<{
      action: string;
      targetCount: number;
      successCount: number;
      promptVersion: string;
      timestamp: string;
    }> = [];

    // Setup: Fake AI Client - Action 2 プロンプト実行時のモック
    const fakeAiClient: Tx9Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        actionId: 'action-01',
        result: { status: 'completed', extractedReportsCount: 8 },
      })),

      executeAction02: jest.fn(async (input: { unsubmittedMemberIds: string[] }) => {
        // Action 2: 未提出メンバー特定・催促実行
        const unsubmittedIds = input.unsubmittedMemberIds;
        const notificationResults = [];

        for (const memberId of unsubmittedIds) {
          const member = unsubmittedMembers.find((m) => m.memberId === memberId);
          if (member) {
            const reminderMessage = `朝会報告の提出期限が近づいています。お手数ですがご提出ください。`;
            const result = await notificationServiceAdapterStub.sendReminderNotification(
              memberId,
              reminderMessage,
            );
            notificationResults.push({ memberId, status: result.status });
          }
        }

        // 監査ログに記録
        auditLogs.push({
          action: 'Action 2: 未提出メンバー催促実行',
          targetCount: unsubmittedIds.length,
          successCount: notificationResults.filter((r) => r.status === 'success').length,
          promptVersion: ACTION_02_PROMPT_VERSION,
          timestamp: new Date().toISOString(),
        });

        return {
          actionId: 'action-02',
          result: {
            status: 'completed',
            unsubmittedCount: unsubmittedIds.length,
            notificationsSent: notificationResults.length,
            allSucceeded: notificationResults.every((r) => r.status === 'success'),
          },
        };
      }),

      executeAction03: jest.fn(async () => ({
        actionId: 'action-03',
        result: { status: 'completed', extractedIssuesCount: 12 },
      })),

      executeAction04: jest.fn(async () => ({
        actionId: 'action-04',
        result: { status: 'completed', prioritizedIssuesCount: 12 },
      })),

      executeAction05: jest.fn(async () => ({
        actionId: 'action-05',
        result: { status: 'completed', proposedMeasuresCount: 5 },
      })),

      executeAction06: jest.fn(async () => ({
        actionId: 'action-06',
        result: { status: 'completed', reportGenerated: true },
      })),

      executeAction07: jest.fn(async () => ({
        actionId: 'action-07',
        result: { status: 'completed', reportDelivered: true },
      })),
    };

    // Execute: runTx9Imp1Agent を実行
    const agentInput = {
      aggregationPeriodStart,
      aggregationPeriodEnd,
      targetTeamIds,
      managerUserId,
    };

    const result = await runTx9Imp1Agent(agentInput, fakeAiClient);

    // Verify: Action 2 が呼び出されたことを確認
    expect(fakeAiClient.executeAction02).toHaveBeenCalled();

    // Verify: Action 2 に渡される入力に未提出メンバー情報が含まれることを検証
    const action02Call = (fakeAiClient.executeAction02 as jest.Mock).mock.calls[0];
    expect(action02Call[0].unsubmittedMemberIds).toContain('member-I');
    expect(action02Call[0].unsubmittedMemberIds).toContain('member-J');
    expect(action02Call[0].unsubmittedMemberIds.length).toBe(2);

    // Verify: NotificationServiceAdapter.sendReminderNotification が2回呼び出されたことを確認
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(2);

    // Verify: 各通知呼び出しに正しいメンバーID が渡されたことを検証
    expect(notificationSendCalls[0].memberId).toBe('member-I');
    expect(notificationSendCalls[1].memberId).toBe('member-J');

    // Verify: 各通知呼び出しに催促メッセージが含まれていることを検証
    expect(notificationSendCalls[0].message).toContain('朝会報告の提出期限が近づいています');
    expect(notificationSendCalls[1].message).toContain('朝会報告の提出期限が近づいています');

    // Verify: Action 2 の実行結果が success で返されることを確認
    const action02Result = (fakeAiClient.executeAction02 as jest.Mock).mock.results[0].value;
    await expect(action02Result).resolves.toMatchObject({
      actionId: 'action-02',
      result: {
        status: 'completed',
        unsubmittedCount: 2,
        notificationsSent: 2,
        allSucceeded: true,
      },
    });

    // Verify: 監査ログに実行記録が記載されていることを確認
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0]).toMatchObject({
      action: 'Action 2: 未提出メンバー催促実行',
      targetCount: 2,
      successCount: 2,
      promptVersion: ACTION_02_PROMPT_VERSION,
    });

    // Verify: 監査ログにタイムスタンプが記録されていることを確認
    expect(auditLogs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Verify: runTx9Imp1Agent の最終結果を確認
    expect(result).toMatchObject({
      analysisReportId: expect.any(String),
      productivityMetrics: expect.objectContaining({
        issueFrequencyPerDay: expect.any(Number),
        averageResolutionDays: expect.any(Number),
        completionRate: expect.any(Number),
      }),
      prioritizedIssues: expect.objectContaining({
        issues: expect.any(Array),
        countermeasures: expect.any(Array),
      }),
      reportDeliveryStatus: 'delivered',
    });
  });
});