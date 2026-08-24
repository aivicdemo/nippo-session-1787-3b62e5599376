import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentInput, type Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/types';

describe('tx-11-imp-1: 日報収集・確認・催促の自動化エージェント', () => {
  // SCEN-3250: [error] ロールバック・補償トランザクション検証
  test('Action 5での外部サービス失敗時に完了済み副作用をロールバック・補償する', async () => {
    const executionId = 'exec-20240115-001';
    const teamId = 'team-dev-001';
    const managerEmail = 'manager@company.com';

    // Action 1: 提出状況 - 提出済み7名、未提出3名
    const submissionStatus = {
      totalMembers: 10,
      submittedCount: 7,
      unsubmittedMembers: ['eng-001', 'eng-002', 'eng-003'],
    };

    // Action 2: 催促通知送信ログ（3件成功）
    const notificationsSentAction2 = [
      { notificationId: 'notif-001', userId: 'eng-001', status: 'delivered', sentAt: new Date('2024-01-15T08:30:00Z') },
      { notificationId: 'notif-002', userId: 'eng-002', status: 'delivered', sentAt: new Date('2024-01-15T08:30:05Z') },
      { notificationId: 'notif-003', userId: 'eng-003', status: 'delivered', sentAt: new Date('2024-01-15T08:30:10Z') },
    ];

    // Action 3: 抽出済み課題キーワード（5件）
    const extractedKeywords = [
      { keywordId: 'kw-001', text: 'database-latency', frequency: 2 },
      { keywordId: 'kw-002', text: 'api-timeout', frequency: 3 },
      { keywordId: 'kw-003', text: 'memory-leak', frequency: 1 },
      { keywordId: 'kw-004', text: 'deployment-issue', frequency: 2 },
      { keywordId: 'kw-005', text: 'config-error', frequency: 1 },
    ];

    // Action 4: 過去事例参照
    const pastExamplesAction4 = [
      { exampleId: 'ex-001', title: 'Previous database-latency incident', resolvedDate: new Date('2024-01-10T00:00:00Z') },
      { exampleId: 'ex-002', title: 'Previous api-timeout fix', resolvedDate: new Date('2024-01-08T00:00:00Z') },
    ];

    // Mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn()
        .mockResolvedValueOnce({ notificationId: 'notif-001', status: 'delivered' })
        .mockResolvedValueOnce({ notificationId: 'notif-002', status: 'delivered' })
        .mockResolvedValueOnce({ notificationId: 'notif-003', status: 'delivered' }),
      
      getDeliveryStatus: jest.fn()
        .mockResolvedValue([
          { notificationId: 'notif-001', status: 'delivered' },
          { notificationId: 'notif-002', status: 'delivered' },
          { notificationId: 'notif-003', status: 'delivered' },
        ]),
      
      cancelNotifications: jest.fn()
        .mockResolvedValue({ cancelledCount: 0, reason: 'external_service_does_not_support_cancellation' }),
      
      updateNotificationStatus: jest.fn()
        .mockResolvedValue({ updated: 3, newStatus: 'ROLLED_BACK' }),
    };

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValue({
          keywords: extractedKeywords,
          confidence: 0.85,
        }),
      
      assessImpactScore: jest.fn()
        .mockRejectedValue(new Error('TextAnalysisServiceAdapter: Internal error - model service unavailable')),
      
      classifyIssueSeverity: jest.fn(),
    };

    // Mock database operations for rollback
    const mockDatabaseAdapter = {
      deleteExtractedKeywords: jest.fn()
        .mockResolvedValue({ deletedCount: 5 }),
      
      insertCompensationLog: jest.fn()
        .mockResolvedValue({ recordId: 'comp-001', timestamp: new Date('2024-01-15T08:31:00Z') }),
      
      insertAuditLog: jest.fn()
        .mockResolvedValue({ auditId: 'audit-001' }),
      
      clearTemporaryCache: jest.fn()
        .mockResolvedValue({ clearedCount: 2 }),
    };

    const agentInput: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T08:30:00Z'),
      teamId: teamId,
      reportDeadlineTime: '09:00',
      managerEmail: managerEmail,
    };

    const mockAiClient = {
      action01_fetchSubmissionStatus: jest.fn().mockResolvedValue(submissionStatus),
      action02_sendReminderNotifications: jest.fn().mockResolvedValue(notificationsSentAction2),
      action03_extractKeywords: jest.fn().mockResolvedValue(extractedKeywords),
      action04_searchPastExamples: jest.fn().mockResolvedValue(pastExamplesAction4),
      action05_prioritizeAndCreateSummary: jest.fn().mockRejectedValue(
        new Error('TextAnalysisServiceAdapter: Internal error - model service unavailable')
      ),
      rollbackNotifications: jest.fn().mockResolvedValue({
        cancelledCount: 0,
        rolledBackCount: 3,
        rolledBackIds: ['notif-001', 'notif-002', 'notif-003'],
      }),
      rollbackExtractedKeywords: jest.fn().mockResolvedValue({ deletedCount: 5 }),
      rollbackCachedExamples: jest.fn().mockResolvedValue({ clearedCount: 2 }),
      insertCompensationRecord: jest.fn().mockResolvedValue({
        compensationId: 'comp-001',
        timestamp: new Date('2024-01-15T08:31:00Z'),
      }),
      insertAuditLog: jest.fn().mockResolvedValue({
        auditId: 'audit-001',
        executionId: executionId,
        action: 'Action 5',
        errorCause: 'TextAnalysisServiceAdapter.assessImpactScore呼び出し失敗',
        rollbackStartTime: new Date('2024-01-15T08:31:00Z'),
        rollbackEndTime: new Date('2024-01-15T08:31:05Z'),
      }),
    };

    let agentResult: Tx11AgentOutput | null = null;
    let agentError: Error | null = null;

    try {
      agentResult = await runTx11Imp1Agent(agentInput, mockAiClient as any);
    } catch (err) {
      agentError = err as Error;
    }

    // 検証: エージェントが例外をスロー
    expect(agentError).not.toBeNull();
    expect(agentError?.message).toMatch(/TextAnalysisServiceAdapter/);

    // 検証: Action 5でエラーが発生したため、Action 6（部長への配信）は実行されない
    expect(agentResult).toBeNull();

    // 検証 (1): 催促通知3件がロールバック状態に更新されている
    expect(mockAiClient.rollbackNotifications).toHaveBeenCalledWith({
      notificationIds: ['notif-001', 'notif-002', 'notif-003'],
      reason: 'Action5_failure_compensation',
    });
    expect(mockAiClient.rollbackNotifications).toHaveBeenCalledTimes(1);

    // 検証 (2): 抽出済み課題キーワード5件がデータベースから削除されている
    expect(mockAiClient.rollbackExtractedKeywords).toHaveBeenCalledWith({
      keywordIds: ['kw-001', 'kw-002', 'kw-003', 'kw-004', 'kw-005'],
    });
    expect(mockAiClient.rollbackExtractedKeywords).toHaveBeenCalledTimes(1);

    // 検証 (3): 過去事例参照キャッシュがクリアされている
    expect(mockAiClient.rollbackCachedExamples).toHaveBeenCalledWith({
      exampleIds: ['ex-001', 'ex-002'],
    });
    expect(mockAiClient.rollbackCachedExamples).toHaveBeenCalledTimes(1);

    // 検証 (4): 補償ログが記録されている
    expect(mockAiClient.insertCompensationRecord).toHaveBeenCalledWith({
      notificationIds: ['notif-001', 'notif-002', 'notif-003'],
      keywordIds: ['kw-001', 'kw-002', 'kw-003', 'kw-004', 'kw-005'],
      reason: 'Action5_failure_compensation',
      timestamp: expect.any(Date),
    });
    expect(mockAiClient.insertCompensationRecord).toHaveBeenCalledTimes(1);

    // 検証 (5): 監査ログが記録されている
    expect(mockAiClient.insertAuditLog).toHaveBeenCalledWith({
      executionId: expect.any(String),
      failedAction: 'Action 5',
      errorCause: expect.stringMatching(/TextAnalysisServiceAdapter/),
      rollbackStartTime: expect.any(Date),
      rollbackEndTime: expect.any(Date),
      status: 'ROLLBACK_COMPLETED',
    });
    expect(mockAiClient.insertAuditLog).toHaveBeenCalledTimes(1);

    // 検証 (6): 外部サービスへの以降のリトライが発生していない
    // (Action 5の失敗直後にロールバック → エージェント終了)
    expect(mockAiClient.action05_prioritizeAndCreateSummary).toHaveBeenCalledTimes(1);
    
    // Action 6（部長への配信）のメソッドがあれば呼ばれないことを確認
    // （このテストでは、ロールバック後は Action 6 は呼ばれていない）

    // 検証 (7): ロールバック処理が正常に完了し、すべての補償トランザクションが実行された
    expect(mockAiClient.rollbackNotifications).toHaveBeenCalledBefore(mockAiClient.insertCompensationRecord as jest.Mock);
    expect(mockAiClient.rollbackExtractedKeywords).toHaveBeenCalledBefore(mockAiClient.insertCompensationRecord as jest.Mock);
    expect(mockAiClient.rollbackCachedExamples).toHaveBeenCalledBefore(mockAiClient.insertCompensationRecord as jest.Mock);
    expect(mockAiClient.insertAuditLog).toHaveBeenCalledAfter(mockAiClient.insertCompensationRecord as jest.Mock);
  });
});