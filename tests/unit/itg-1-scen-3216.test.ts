import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント', () => {
  // SCEN-3216
  test('should execute Action 1 (aggregate reports for specified period) and return structured aggregation result with 10 complete records', async () => {
    // Arrange: テストデータの準備
    const aggregationPeriodStart = new Date('2026-01-01T00:00:00Z');
    const aggregationPeriodEnd = new Date('2026-01-31T23:59:59Z');
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-001';

    // テストデータ: メンバーA～J (10名) の日報
    const mockReportRecords = [
      {
        reportId: 'report-001',
        memberId: 'member-001',
        reportDate: '2026-01-05T08:30:00Z',
        yesterdayAccomplishment: 'フロントエンド実装完了',
        todayPlan: 'バックエンド検証',
        currentChallenges: 'データベース接続エラー',
      },
      {
        reportId: 'report-002',
        memberId: 'member-002',
        reportDate: '2026-01-06T08:35:00Z',
        yesterdayAccomplishment: 'テストケース作成',
        todayPlan: 'テスト実行',
        currentChallenges: '外部API遅延',
      },
      {
        reportId: 'report-003',
        memberId: 'member-003',
        reportDate: '2026-01-07T08:32:00Z',
        yesterdayAccomplishment: 'ドキュメント更新',
        todayPlan: 'レビュー対応',
        currentChallenges: 'リソース不足',
      },
      {
        reportId: 'report-004',
        memberId: 'member-004',
        reportDate: '2026-01-08T08:31:00Z',
        yesterdayAccomplishment: 'バグ修正',
        todayPlan: 'リリース準備',
        currentChallenges: 'デプロイ環境構築',
      },
      {
        reportId: 'report-005',
        memberId: 'member-005',
        reportDate: '2026-01-09T08:33:00Z',
        yesterdayAccomplishment: 'インフラ改善',
        todayPlan: 'パフォーマンステスト',
        currentChallenges: 'ネットワーク遅延',
      },
      {
        reportId: 'report-006',
        memberId: 'member-006',
        reportDate: '2026-01-10T08:34:00Z',
        yesterdayAccomplishment: 'セキュリティ監査',
        todayPlan: '脆弱性対応',
        currentChallenges: '依存ライブラリ更新',
      },
      {
        reportId: 'report-007',
        memberId: 'member-007',
        reportDate: '2026-01-13T08:30:00Z',
        yesterdayAccomplishment: '要件定義',
        todayPlan: '基本設計',
        currentChallenges: 'ステークホルダー調整',
      },
      {
        reportId: 'report-008',
        memberId: 'member-008',
        reportDate: '2026-01-14T08:31:00Z',
        yesterdayAccomplishment: 'UI/UX改善',
        todayPlan: 'ユーザーテスト',
        currentChallenges: 'ブラウザ互換性',
      },
      {
        reportId: 'report-009',
        memberId: 'member-009',
        reportDate: '2026-01-15T08:32:00Z',
        yesterdayAccomplishment: 'API開発',
        todayPlan: '統合テスト',
        currentChallenges: 'エラーハンドリング',
      },
      {
        reportId: 'report-010',
        memberId: 'member-010',
        reportDate: '2026-01-16T08:33:00Z',
        yesterdayAccomplishment: 'ログ分析',
        todayPlan: 'アラート設定',
        currentChallenges: 'データ量増加',
      },
    ];

    // NotificationServiceAdapter のスタブ実装
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'delivered',
        sentAt: '2026-01-01T08:30:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        deliveredAt: '2026-01-01T08:30:00Z',
      }),
    };

    // TextAnalysisServiceAdapter のスタブ実装
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 3, confidence: 0.92 },
          { keyword: '外部API遅延', frequency: 2, confidence: 0.88 },
          { keyword: 'リソース不足', frequency: 2, confidence: 0.85 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 78,
        severity: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        classification: '緊急対応必要',
      }),
    };

    // Tx9Imp1AiClient のスタブ実装
    const mockAiClient: Tx9Imp1AiClient = {
      executeAction01AggregateReports: jest.fn().mockResolvedValue({
        aggregatedReports: mockReportRecords,
        aggregationPeriod: {
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        },
        totalRecordCount: 10,
        extractedFields: ['yesterdayAccomplishment', 'todayPlan', 'currentChallenges'],
        dataCompletenessFlag: true,
        aggregatedAt: '2026-01-01T09:00:00Z',
      }),
      executeAction02IdentifyNonSubmitters: jest.fn().mockResolvedValue({
        nonSubmitterCount: 0,
        nonSubmitterList: [],
        reminderNotificationsSent: 0,
      }),
      executeAction03ExtractAndClassifyIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: 'issue-001',
            keyword: 'データベース接続エラー',
            frequency: 3,
            category: 'infrastructure',
            severity: 'high',
          },
          {
            issueId: 'issue-002',
            keyword: '外部API遅延',
            frequency: 2,
            category: 'external-dependency',
            severity: 'medium',
          },
        ],
      }),
      executeAction04QuantifyProductivityMetrics: jest.fn().mockResolvedValue({
        issueFrequencyPerDay: 0.5,
        averageResolutionDays: 2.5,
        completionRate: 85,
      }),
      executeAction05PrioritizeAndAnalyzeIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            rank: 1,
            issueId: 'issue-001',
            keyword: 'データベース接続エラー',
            priorityScore: 92,
            recommendedCountermeasure: 'DB接続プール最適化',
          },
          {
            rank: 2,
            issueId: 'issue-002',
            keyword: '外部API遅延',
            priorityScore: 76,
            recommendedCountermeasure: 'タイムアウト設定調整',
          },
        ],
      }),
      executeAction06ProposeCountermeasures: jest.fn().mockResolvedValue({
        countermeasures: [
          {
            measureId: 'measure-001',
            targetIssueId: 'issue-001',
            proposal: 'DB接続プール最適化を実施',
            estimatedDays: 3,
            priority: 'high',
          },
        ],
      }),
      executeAction07GenerateAndDeliverReport: jest.fn().mockResolvedValue({
        reportId: 'analysis-report-001',
        deliveryStatus: 'delivered',
        deliveredAt: '2026-01-01T09:15:00Z',
        reportContent: {
          aggregationPeriod: {
            startDate: '2026-01-01',
            endDate: '2026-01-31',
          },
          productivityMetrics: {
            issueFrequencyPerDay: 0.5,
            averageResolutionDays: 2.5,
            completionRate: 85,
          },
          prioritizedIssues: [
            {
              rank: 1,
              keyword: 'データベース接続エラー',
              priorityScore: 92,
            },
          ],
          recommendedCountermeasures: [
            {
              proposal: 'DB接続プール最適化を実施',
              priority: 'high',
            },
          ],
        },
      }),
    };

    // Act: runTx9Imp1Agent を実行
    const result = await runTx9Imp1Agent(
      {
        aggregationPeriodStart,
        aggregationPeriodEnd,
        targetTeamIds,
        managerUserId,
      },
      mockAiClient
    );

    // Assert: Action 1の実行確認
    expect(mockAiClient.executeAction01AggregateReports).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregationPeriodStart,
        aggregationPeriodEnd,
        targetTeamIds,
      })
    );

    // Assert: 集約結果の構造確認
    expect(result).toBeDefined();
    expect(result.aggregatedReports).toHaveLength(10);
    expect(result.aggregationPeriod).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(result.totalRecordCount).toBe(10);
    expect(result.dataCompletenessFlag).toBe(true);
    expect(result.aggregatedAt).toBe('2026-01-01T09:00:00Z');

    // Assert: 抽出フィールドの確認
    expect(result.extractedFields).toContain('yesterdayAccomplishment');
    expect(result.extractedFields).toContain('todayPlan');
    expect(result.extractedFields).toContain('currentChallenges');

    // Assert: 集約されたデータの内容確認
    const firstRecord = result.aggregatedReports[0];
    expect(firstRecord).toHaveProperty('reportId', 'report-001');
    expect(firstRecord).toHaveProperty('yesterdayAccomplishment', 'フロントエンド実装完了');
    expect(firstRecord).toHaveProperty('todayPlan', 'バックエンド検証');
    expect(firstRecord).toHaveProperty('currentChallenges', 'データベース接続エラー');

    // Assert: 全10件のデータが正確に集約されたことを確認
    result.aggregatedReports.forEach((record, index) => {
      expect(record.reportId).toBe(`report-${String(index + 1).padStart(3, '0')}`);
      expect(record.memberId).toBe(`member-${String(index + 1).padStart(3, '0')}`);
    });

    // Assert: 後続Action 2の実行確認（集約結果が正しく受け渡されているか）
    expect(mockAiClient.executeAction02IdentifyNonSubmitters).toHaveBeenCalled();

    // Assert: 最終的な分析報告書の生成と配信確認
    expect(mockAiClient.executeAction07GenerateAndDeliverReport).toHaveBeenCalled();
    expect(result.reportId).toBe('analysis-report-001');
  });
});