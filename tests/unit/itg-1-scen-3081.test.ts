import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-02';

describe('Tx1Imp1Agent - 未提出者通知の自律実行', () => {
  // SCEN-3081
  test('日報集約から課題優先順位付けと未提出通知までの自律実行 - 未提出者への自動通知送信', async () => {
    // ========== モック設定 ==========
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        success: true,
        aggregatedReportCount: 7,
        totalTeamMembers: 10,
        unsubmittedUserIds: ['U003', 'U007', 'U009'],
      }),
      executeAction02: jest.fn().mockResolvedValue({
        success: true,
        unsubmittedUsers: [
          { userId: 'U003', userName: '田中太郎', reportDeadlineTime: '2024-01-15T09:00:00Z' },
          { userId: 'U007', userName: '鈴木花子', reportDeadlineTime: '2024-01-15T09:00:00Z' },
          { userId: 'U009', userName: '佐藤次郎', reportDeadlineTime: '2024-01-15T09:00:00Z' },
        ],
        notificationPrompt: buildAction02Prompt({
          unsubmittedCount: 3,
          deadlineTime: '2024-01-15T09:00:00Z',
        }),
        promptVersion: ACTION_02_PROMPT_VERSION,
      }),
      executeAction03: jest.fn().mockResolvedValue({
        success: true,
        extractedIssuesCount: 12,
      }),
      executeAction04: jest.fn().mockResolvedValue({
        success: true,
        prioritizedIssuesCount: 12,
      }),
      executeAction05: jest.fn().mockResolvedValue({
        success: true,
        materialGenerated: true,
      }),
      executeAction06: jest.fn().mockResolvedValue({
        success: true,
        managerNotified: true,
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValueOnce({
          status: 'delivered',
          userId: 'U003',
          deliveredAt: '2024-01-15T08:45:00Z',
        })
        .mockResolvedValueOnce({
          status: 'delivered',
          userId: 'U007',
          deliveredAt: '2024-01-15T08:45:05Z',
        })
        .mockResolvedValueOnce({
          status: 'delivered',
          userId: 'U009',
          deliveredAt: '2024-01-15T08:45:10Z',
        }),
    };

    const mockAuditLogger = {
      log: jest.fn(),
    };

    const testInput = {
      executionTimestamp: new Date('2024-01-15T08:30:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:30:00Z'),
      targetTeamIds: ['TEAM001'],
      managerUserId: 'MGR001',
    };

    // ========== テスト実行 ==========
    const result = await runTx1Imp1Agent(
      testInput,
      mockAiClient as any,
      mockNotificationAdapter as any,
      mockAuditLogger as any
    );

    // ========== Action-02 実行検証 ==========
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    const action02Result = mockAiClient.executeAction02.mock.results[0].value;
    expect(action02Result.promptVersion).toBe(ACTION_02_PROMPT_VERSION);
    expect(action02Result.unsubmittedUsers).toHaveLength(3);
    expect(action02Result.unsubmittedUsers[0].userId).toBe('U003');
    expect(action02Result.unsubmittedUsers[1].userId).toBe('U007');
    expect(action02Result.unsubmittedUsers[2].userId).toBe('U009');

    // ========== NotificationServiceAdapter 呼び出し検証 ==========
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(3);

    // 第1回呼び出し検証
    const firstCall = mockNotificationAdapter.sendReminderNotification.mock.calls[0][0];
    expect(firstCall.userId).toBe('U003');
    expect(firstCall.userName).toBe('田中太郎');

    // 第2回呼び出し検証
    const secondCall = mockNotificationAdapter.sendReminderNotification.mock.calls[1][0];
    expect(secondCall.userId).toBe('U007');
    expect(secondCall.userName).toBe('鈴木花子');

    // 第3回呼び出し検証
    const thirdCall = mockNotificationAdapter.sendReminderNotification.mock.calls[2][0];
    expect(thirdCall.userId).toBe('U009');
    expect(thirdCall.userName).toBe('佐藤次郎');

    // ========== 配信ステータス検証 ==========
    const firstDeliveryResult = await mockNotificationAdapter.sendReminderNotification(
      firstCall
    );
    const secondDeliveryResult = await mockNotificationAdapter.sendReminderNotification(
      secondCall
    );
    const thirdDeliveryResult = await mockNotificationAdapter.sendReminderNotification(
      thirdCall
    );

    expect(firstDeliveryResult.status).toBe('delivered');
    expect(secondDeliveryResult.status).toBe('delivered');
    expect(thirdDeliveryResult.status).toBe('delivered');

    // ========== エージェント実行結果検証 ==========
    expect(result.executionStatus).toBe('success');
    expect(result.unsubmittedMembersNotified).toBe(true);
    expect(
      result.reportAggregationSummary.unsubmittedMembers.map((m) => m.userId)
    ).toEqual(['U003', 'U007', 'U009']);
    expect(result.reportAggregationSummary.totalTeamMembers).toBe(10);
    expect(result.reportAggregationSummary.submittedCount).toBe(7);

    // ========== 監査ログ検証 ==========
    expect(mockAuditLogger.log).toHaveBeenCalled();
    const auditLogs = mockAuditLogger.log.mock.calls;
    const action02AuditLog = auditLogs.find(
      (call) => call[0].actionId === 'action-02'
    );
    expect(action02AuditLog).toBeDefined();
    expect(action02AuditLog[0].result).toBe('success');
    expect(action02AuditLog[0].targetUsers).toEqual(['U003', 'U007', 'U009']);
    expect(action02AuditLog[0].targetUserCount).toBe(3);
  });
});