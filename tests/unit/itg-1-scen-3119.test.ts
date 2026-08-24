import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('日報集約から優先度別課題一覧提示までの自動判定・配信 - エスカレーション検出と人への引き継ぎ', () => {
  test('SCEN-3119: 判定ルールに該当しない異例な課題を検出した場合、メール送信前に処理を停止し部長への人的確認を必須とする', async () => {
    // ===== Setup: Input Data =====
    const aggregatedReportIds = ['report_001', 'report_002', 'report_003'];
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-12';
    const managerUserId = 'manager_001';
    const priorityThresholdScore = 70;

    const mockAggregatedReports = [
      {
        id: 'report_001',
        teamId: 'team_alpha',
        submitterId: 'user_001',
        issueContent: '既知のAPI仕様変更によるエラー',
        submittedAt: '2024-01-12T08:30:00Z',
      },
      {
        id: 'report_002',
        teamId: 'team_alpha',
        submitterId: 'user_002',
        issueContent: '未確認の外部依存ライブラリの動作異常',
        submittedAt: '2024-01-12T08:45:00Z',
      },
      {
        id: 'report_003',
        teamId: 'team_alpha',
        submitterId: 'user_003',
        issueContent: '【異例】物理的ハードウェア故障による本社全体システム停止',
        submittedAt: '2024-01-12T09:00:00Z',
      },
    ];

    // ===== Setup: Mock AI Client =====
    const mockAiClient: Tx3Imp1AiClient = {
      // Action 1: extractKeywords - 標準的な課題キーワードを抽出
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'API仕様変更', frequency: 1, confidence: 0.95 },
          { keyword: '外部ライブラリ', frequency: 1, confidence: 0.92 },
          { keyword: 'ハードウェア故障', frequency: 1, confidence: 0.88 },
        ],
      }),

      // Action 2: classifyIssueCategory - 事前定義カテゴリに分類
      classifyIssueCategory: jest.fn().mockResolvedValue({
        classifications: [
          { keyword: 'API仕様変更', category: 'External API' },
          { keyword: '外部ライブラリ', category: 'Dependency' },
          { keyword: 'ハードウェア故障', category: 'ANOMALOUS_UNCLASSIFIED' },
        ],
      }),

      // Action 3a: assessImpactScore - 影響度スコア算出
      assessImpactScore: jest.fn().mockResolvedValue({
        scores: [
          { keyword: 'API仕様変更', impactScore: 65 },
          { keyword: '外部ライブラリ', impactScore: 72 },
          { keyword: 'ハードウェア故障', impactScore: 150 }, // 異例値：0-100範囲外
        ],
      }),

      // Action 3b: classifyIssueSeverity - 重要度分類
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severities: [
          { keyword: 'API仕様変更', severity: 'MEDIUM' },
          { keyword: '外部ライブラリ', severity: 'HIGH' },
          { keyword: 'ハードウェア故障', severity: 'UNDEFINED' }, // 異例値：定義済み値以外
        ],
      }),

      // Action 4: generatePrioritizedList - 優先度別一覧生成
      generatePrioritizedList: jest.fn(),

      // Action 5: sendManagerEmail - メール送信
      sendManagerEmail: jest.fn(),

      // Escalation: detectAnomalies - 異例課題検出
      detectAnomalies: jest.fn().mockResolvedValue({
        hasAnomalies: true,
        anomalies: [
          {
            issueId: 'issue_003',
            reason: 'ANOMALOUS_UNCLASSIFIED_CATEGORY',
            detailedReason: '判定ルールに該当しない異例な課題',
            keyword: 'ハードウェア故障',
            problematicValue: 'severity=UNDEFINED, impactScore=150',
          },
        ],
      }),

      // Escalation: notifyManagerForManualReview - 部長への通知
      notifyManagerForManualReview: jest.fn().mockResolvedValue({
        notificationId: 'notify_001',
        status: 'DELIVERED',
        deliveredAt: '2024-01-12T09:15:00Z',
      }),

      // Audit: logEscalationEvent - 監査ログ記録
      logEscalationEvent: jest.fn().mockResolvedValue({
        auditLogId: 'audit_001',
        eventType: 'ESCALATION_DETECTED_ANOMALOUS_ISSUE',
        recordedAt: '2024-01-12T09:15:00Z',
      }),

      // Fallback: recordEscalationToDB - DB記録
      recordEscalationToDB: jest.fn().mockResolvedValue({
        recordId: 'escalation_record_001',
        tableName: '課題判定ログ',
        escalationReason: '判定ルールに該当しない異例な課題',
        affectedIssueIds: ['issue_003'],
        recordedTimestamp: '2024-01-12T09:15:00Z',
      }),
    };

    // ===== Setup: Mock External Services =====
    const mockNotificationService = {
      sendReminderNotification: jest.fn(),
    };

    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // ===== Execution =====
    const input = {
      aggregatedReportIds,
      analysisStartDate,
      analysisEndDate,
      managerUserId,
      priorityThresholdScore,
    };

    const agentExecutionContext = {
      executingUserId: 'system_agent',
      teamId: 'team_alpha',
      retryAttempt: 0,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient, agentExecutionContext);

    // ===== Assertions: Escalation Detection =====
    expect(mockAiClient.detectAnomalies).toHaveBeenCalled();
    expect(mockAiClient.detectAnomalies).toHaveBeenCalledWith(
      expect.objectContaining({
        classifications: expect.arrayContaining([
          expect.objectContaining({
            category: 'ANOMALOUS_UNCLASSIFIED',
          }),
        ]),
        scores: expect.arrayContaining([
          expect.objectContaining({
            impactScore: 150,
          }),
        ]),
        severities: expect.arrayContaining([
          expect.objectContaining({
            severity: 'UNDEFINED',
          }),
        ]),
      })
    );

    // ===== Assertions: Action 4 NOT Executed =====
    expect(mockAiClient.generatePrioritizedList).not.toHaveBeenCalled();

    // ===== Assertions: Action 5 NOT Executed =====
    expect(mockAiClient.sendManagerEmail).not.toHaveBeenCalled();

    // ===== Assertions: Manager Manual Review Notification =====
    expect(mockAiClient.notifyManagerForManualReview).toHaveBeenCalled();
    expect(mockAiClient.notifyManagerForManualReview).toHaveBeenCalledWith(
      expect.objectContaining({
        managerUserId,
        anomalies: expect.arrayContaining([
          expect.objectContaining({
            reason: 'ANOMALOUS_UNCLASSIFIED_CATEGORY',
            detailedReason: '判定ルールに該当しない異例な課題',
          }),
        ]),
      })
    );

    // ===== Assertions: Database Escalation Log =====
    expect(mockAiClient.recordEscalationToDB).toHaveBeenCalled();
    const dbRecordCall = mockAiClient.recordEscalationToDB.mock.calls[0][0];
    expect(dbRecordCall).toMatchObject({
      tableName: '課題判定ログ',
      escalationReason: '判定ルールに該当しない異例な課題',
      affectedIssueIds: expect.arrayContaining(['issue_003']),
    });
    expect(dbRecordCall.recordedTimestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);

    // ===== Assertions: Audit Log Event =====
    expect(mockAiClient.logEscalationEvent).toHaveBeenCalled();
    expect(mockAiClient.logEscalationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ESCALATION_DETECTED_ANOMALOUS_ISSUE',
      })
    );

    // ===== Assertions: Execution Status =====
    expect(result).toMatchObject({
      executionId: expect.any(String),
      extractedIssuesCount: 3,
      emailSendStatus: 'PENDING_MANUAL_REVIEW',
      completionTimestamp: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/),
    });

    // ===== Assertions: Escalation Info in Output =====
    expect(result).toMatchObject({
      escalationDetected: true,
      escalationReason: '判定ルールに該当しない異例な課題',
      manualReviewRequired: true,
      notificationSentToManager: true,
    });

    // ===== Assertions: No Mail Delivery =====
    expect(result.prioritizedIssuesList).toBeUndefined();
  });
});