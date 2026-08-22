import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-140: idempotent retry - 同一要求の再実行時に重複書き込みや通知が発生しないこと
  test('SCEN-140: 同一の月次レポート生成要求を再実行しても分析結果は重複せず、通知は1件のみ', async () => {
    // Arrange: テスト用データの初期化
    const requestId = 'REQ-2024-01-001';
    const targetMonth = '2024-01';
    const teamId = 'TEAM-A001';
    const triggeredAt = new Date('2024-01-01T00:00:00Z');
    const triggeredBy = 'schedule' as const;

    // Mock AI client
    const mockAiClient = {
      extractMonthlyData: jest.fn().mockResolvedValue({
        reportCount: 25,
        totalChallenges: 48,
        extractedAt: triggeredAt,
      }),
      analyzeTimeSeriesTrend: jest.fn().mockResolvedValue({
        dailyMetrics: [
          {
            date: '2024-01-01',
            bottleneckSeverity: 3,
            resolvedCount: 2,
            newCount: 4,
          },
          {
            date: '2024-01-02',
            bottleneckSeverity: 4,
            resolvedCount: 1,
            newCount: 5,
          },
        ],
        improvementTrend: 'deteriorating' as const,
      }),
      identifyBottleneckPattern: jest.fn().mockResolvedValue({
        recurringIssues: ['API遅延', 'デプロイエラー'],
        estimatedRootCause: 'インフラストラクチャ容量不足',
      }),
      rankChallengesByPriority: jest.fn().mockResolvedValue({
        topPriorities: [
          {
            challengeId: 'CH-001',
            keyword: 'API遅延',
            scoreValue: 95,
            impactScope: 'critical',
            occurrenceFrequency: 'daily',
          },
          {
            challengeId: 'CH-002',
            keyword: 'デプロイエラー',
            scoreValue: 87,
            impactScope: 'high',
            occurrenceFrequency: 'weekly',
          },
        ],
      }),
      computeTeamMetrics: jest.fn().mockResolvedValue({
        teamPerformanceMetrics: {
          teamId,
          avgChallengeResolutionHours: 18.5,
          reportSubmissionRate: 0.92,
          recurrenceRate: 0.12,
          metricsCalculatedAt: triggeredAt,
        },
      }),
      generateAnalysisReport: jest.fn().mockResolvedValue({
        reportId: 'RPT-2024-01-A001',
        reportContent: {
          generatedAt: triggeredAt,
          topPriorityChallenges: [
            {
              challengeId: 'CH-001',
              keyword: 'API遅延',
              scoreValue: 95,
              impactScope: 'critical',
              occurrenceFrequency: 'daily',
            },
          ],
          bottleneckTrend: {
            timeSeriesData: [
              {
                date: '2024-01-01',
                bottleneckSeverity: 3,
                resolvedCount: 2,
                newCount: 4,
              },
            ],
            improvementTrend: 'deteriorating',
            recurringIssuePattern: ['API遅延', 'デプロイエラー'],
          },
          teamPerformanceMetrics: {
            teamId,
            avgChallengeResolutionHours: 18.5,
            reportSubmissionRate: 0.92,
            recurrenceRate: 0.12,
            metricsCalculatedAt: triggeredAt,
          },
        },
      }),
      notifyLeadershipWithReport: jest.fn().mockResolvedValue({
        notificationId: 'NOTIF-001',
        recipients: ['leader@company.example.com'],
        sentAt: triggeredAt,
        status: 'sent',
      }),
    };

    // Mock database layer
    const mockDb = {
      findExistingReport: jest.fn(),
      saveMonthlyReport: jest.fn(),
      saveBotleneckAnalysis: jest.fn(),
      saveTeamMetrics: jest.fn(),
      recordAuditLog: jest.fn(),
      findNotificationByRequestId: jest.fn(),
    };

    // 初回実行用にデータベースを初期化（既存レポートなし）
    mockDb.findExistingReport.mockResolvedValueOnce(null);
    mockDb.saveMonthlyReport.mockResolvedValueOnce({
      reportId: 'RPT-2024-01-A001',
      requestId,
      teamId,
      targetMonth,
      generatedAt: triggeredAt,
      status: 'COMPLETED',
    });
    mockDb.saveBotleneckAnalysis.mockResolvedValueOnce({
      analysisId: 'ANALYSIS-001',
      reportId: 'RPT-2024-01-A001',
      timeSeriesData: [
        {
          date: '2024-01-01',
          bottleneckSeverity: 3,
          resolvedCount: 2,
          newCount: 4,
        },
      ],
      improvementTrend: 'deteriorating',
      recurringIssuePattern: ['API遅延', 'デプロイエラー'],
    });
    mockDb.saveTeamMetrics.mockResolvedValueOnce({
      metricsId: 'METRICS-001',
      teamId,
      avgChallengeResolutionHours: 18.5,
      reportSubmissionRate: 0.92,
      recurrenceRate: 0.12,
    });
    mockDb.recordAuditLog.mockResolvedValueOnce({
      auditId: 'AUDIT-001',
      requestId,
      executionCount: 1,
      status: 'COMPLETED',
      executedAt: triggeredAt,
    });
    mockDb.findNotificationByRequestId.mockResolvedValueOnce(null);

    const request1 = {
      targetMonth,
      teamId,
      triggeredBy,
      includeDetailedAnalysis: true,
    };

    // Act: 初回実行
    const result1 = await runTx7Imp1Agent(request1, mockAiClient);

    // Assert: 初回実行の検証
    expect(result1.reportId).toBe('RPT-2024-01-A001');
    expect(result1.status).toBe('success');
    expect(result1.generatedAt).toEqual(triggeredAt);
    expect(result1.topPriorityChallenges).toHaveLength(1);
    expect(result1.topPriorityChallenges[0].keyword).toBe('API遅延');
    expect(result1.bottleneckTrend.improvementTrend).toBe('deteriorating');
    expect(result1.bottleneckTrend.recurringIssuePattern).toEqual([
      'API遅延',
      'デプロイエラー',
    ]);
    expect(result1.teamPerformanceMetrics.teamId).toBe(teamId);
    expect(result1.teamPerformanceMetrics.reportSubmissionRate).toBe(0.92);
    expect(result1.emailSentTo).toContain('leader@company.example.com');

    // 初回実行後のデータベース状態を記録
    expect(mockDb.saveMonthlyReport).toHaveBeenCalledTimes(1);
    expect(mockDb.saveBotleneckAnalysis).toHaveBeenCalledTimes(1);
    expect(mockDb.saveTeamMetrics).toHaveBeenCalledTimes(1);
    expect(mockDb.recordAuditLog).toHaveBeenCalledTimes(1);

    const firstAuditCall = mockDb.recordAuditLog.mock.calls[0][0];
    expect(firstAuditCall.status).toBe('COMPLETED');
    expect(firstAuditCall.executionCount).toBe(1);

    // Arrange: 2回目実行用のモック設定（既存レポートが存在）
    mockDb.findExistingReport.mockResolvedValueOnce({
      reportId: 'RPT-2024-01-A001',
      requestId,
      teamId,
      targetMonth,
      generatedAt: triggeredAt,
      status: 'COMPLETED',
    });
    mockDb.findNotificationByRequestId.mockResolvedValueOnce({
      notificationId: 'NOTIF-001',
      requestId,
      recipients: ['leader@company.example.com'],
      sentAt: triggeredAt,
      status: 'sent',
    });
    mockDb.recordAuditLog.mockResolvedValueOnce({
      auditId: 'AUDIT-002',
      requestId,
      executionCount: 2,
      status: 'IDEMPOTENT_NOOP',
      executedAt: new Date('2024-01-01T00:05:00Z'),
    });

    // Act: 2回目実行（同一要求）
    const result2 = await runTx7Imp1Agent(request1, mockAiClient);

    // Assert: 2回目実行の検証 - idempotent

    // 同じレポートが返される
    expect(result2.reportId).toBe('RPT-2024-01-A001');
    expect(result2.generatedAt).toEqual(triggeredAt);

    // 重複書き込みが発生していない
    // saveMonthlyReport は初回のみ（2回目は呼ばれない）
    expect(mockDb.saveMonthlyReport).toHaveBeenCalledTimes(1);
    // saveBotleneckAnalysis も初回のみ
    expect(mockDb.saveBotleneckAnalysis).toHaveBeenCalledTimes(1);
    // saveTeamMetrics も初回のみ
    expect(mockDb.saveTeamMetrics).toHaveBeenCalledTimes(1);

    // 通知は重複されていない（2回目は保存されない）
    const notificationCalls = mockDb.recordAuditLog.mock.calls;
    expect(notificationCalls).toHaveLength(2);

    // 2回目の監査ログはIDEMPOTENT_NOOP
    const secondAuditCall = notificationCalls[1][0];
    expect(secondAuditCall.status).toMatch(
      /IDEMPOTENT_NOOP|RETRY_SKIPPED/
    );
    expect(secondAuditCall.executionCount).toBe(2);
    expect(secondAuditCall.requestId).toBe(requestId);

    // 分析結果が初回と同一
    expect(result2.topPriorityChallenges).toEqual(
      result1.topPriorityChallenges
    );
    expect(result2.bottleneckTrend.improvementTrend).toBe(
      result1.bottleneckTrend.improvementTrend
    );
    expect(result2.bottleneckTrend.recurringIssuePattern).toEqual(
      result1.bottleneckTrend.recurringIssuePattern
    );
    expect(result2.teamPerformanceMetrics.avgChallengeResolutionHours).toBe(
      result1.teamPerformanceMetrics.avgChallengeResolutionHours
    );

    // 既存レポートの検索が呼ばれている（2回目実行で重複チェック）
    expect(mockDb.findExistingReport).toHaveBeenCalledTimes(2);
    expect(mockDb.findExistingReport).toHaveBeenNthCalledWith(2, {
      requestId,
      targetMonth,
      teamId,
    });

    // 既存通知の検索が呼ばれている
    expect(mockDb.findNotificationByRequestId).toHaveBeenCalledTimes(2);
  });
});