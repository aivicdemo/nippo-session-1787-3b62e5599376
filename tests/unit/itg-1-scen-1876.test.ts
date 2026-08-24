import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type {
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
  Tx7Imp1AiClient,
} from '../../src/agents/tx-7-imp-1/orchestrator';
import type { NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('月次課題傾向分析レポート生成 - 複数プロジェクト対応', () => {
  // SCEN-1876
  test('同一部長に紐付く複数プロジェクトの場合、重複した通知が1回のみ送出される', async () => {
    // テストデータ: 同一部長Aに紐付く2プロジェクト
    const targetMonth = '2024-01';
    const managerUserId = 'manager-a';
    const projectX_teamId = 'team-project-x';
    const projectY_teamId = 'team-project-y';

    // プロジェクトXの月次報告データ（5名）
    const projectX_reports = [
      {
        reportId: 'report-x-001',
        teamId: projectX_teamId,
        userId: 'engineer-x-001',
        submittedAt: new Date('2024-01-05T08:30:00Z'),
        yesterday: 'インフラ構築作業を実施',
        today: 'テスト環境へのデプロイ予定',
        challenges: 'ネットワーク遅延の問題が発生',
      },
      {
        reportId: 'report-x-002',
        teamId: projectX_teamId,
        userId: 'engineer-x-002',
        submittedAt: new Date('2024-01-05T08:45:00Z'),
        yesterday: 'APIスキーマの設計を完了',
        today: 'エンドポイント実装を開始',
        challenges: 'データベース接続タイムアウトが発生',
      },
      {
        reportId: 'report-x-003',
        teamId: projectX_teamId,
        userId: 'engineer-x-003',
        submittedAt: new Date('2024-01-05T09:00:00Z'),
        yesterday: 'フロントエンド統合テストを実施',
        today: 'バグ修正作業を継続',
        challenges: 'ネットワーク遅延の問題が発生',
      },
      {
        reportId: 'report-x-004',
        teamId: projectX_teamId,
        userId: 'engineer-x-004',
        submittedAt: new Date('2024-01-05T09:15:00Z'),
        yesterday: 'ドキュメント作成を進める',
        today: 'レビュー対応を実施',
        challenges: 'ドキュメンテーション遅延',
      },
      {
        reportId: 'report-x-005',
        teamId: projectX_teamId,
        userId: 'engineer-x-005',
        submittedAt: new Date('2024-01-05T09:30:00Z'),
        yesterday: 'セキュリティ脆弱性スキャンを実施',
        today: '脆弱性対応を開始',
        challenges: 'ネットワーク遅延の問題が発生',
      },
    ];

    // プロジェクトYの月次報告データ（5名）
    const projectY_reports = [
      {
        reportId: 'report-y-001',
        teamId: projectY_teamId,
        userId: 'engineer-y-001',
        submittedAt: new Date('2024-01-05T08:30:00Z'),
        yesterday: 'マイグレーション計画を策定',
        today: 'マイグレーション実装を開始',
        challenges: 'ネットワーク遅延の問題が発生',
      },
      {
        reportId: 'report-y-002',
        teamId: projectY_teamId,
        userId: 'engineer-y-002',
        submittedAt: new Date('2024-01-05T08:45:00Z'),
        yesterday: 'パフォーマンステストを完了',
        today: '最適化作業を実施',
        challenges: 'データベース接続タイムアウトが発生',
      },
      {
        reportId: 'report-y-003',
        teamId: projectY_teamId,
        userId: 'engineer-y-003',
        submittedAt: new Date('2024-01-05T09:00:00Z'),
        yesterday: 'バックアップ復旧テストを実施',
        today: '本番環境への適用を準備',
        challenges: 'ネットワーク遅延の問題が発生',
      },
      {
        reportId: 'report-y-004',
        teamId: projectY_teamId,
        userId: 'engineer-y-004',
        submittedAt: new Date('2024-01-05T09:15:00Z'),
        yesterday: 'インシデント報告書を作成',
        today: 'インシデント対応を継続',
        challenges: 'インシデント対応遅延',
      },
      {
        reportId: 'report-y-005',
        teamId: projectY_teamId,
        userId: 'engineer-y-005',
        submittedAt: new Date('2024-01-05T09:30:00Z'),
        yesterday: 'ログ分析を実施',
        today: 'アラート設定を更新',
        challenges: 'ネットワーク遅延の問題が発生',
      },
    ];

    // NotificationServiceAdapterのモック
    const notificationSendCalls: Array<{
      userId: string;
      message: string;
    }> = [];

    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockImplementation(
          async (userId: string, message: string, _remainingTime?: string) => {
            notificationSendCalls.push({ userId, message });
            return { success: true, deliveryStatus: 'sent' };
          }
        ),
      scheduleNotification: jest
        .fn()
        .mockResolvedValue({ success: true, scheduledAt: new Date() }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ status: 'delivered', sentAt: new Date() }),
    };

    // AIクライアントのモック
    const mockAiClient: Tx7Imp1AiClient = {
      extractChallengesAndTrends: jest.fn().mockResolvedValue({
        challenges: [
          {
            keyword: 'ネットワーク遅延の問題',
            frequency: 6,
            impactScore: 85,
          },
          {
            keyword: 'データベース接続タイムアウト',
            frequency: 2,
            impactScore: 75,
          },
          {
            keyword: 'ドキュメンテーション遅延',
            frequency: 1,
            impactScore: 40,
          },
          {
            keyword: 'インシデント対応遅延',
            frequency: 1,
            impactScore: 65,
          },
        ],
      }),
      analyzeBottleneckTrend: jest.fn().mockResolvedValue({
        timeSeriesData: [
          { date: '2024-01-01', severity: 2 },
          { date: '2024-01-02', severity: 3 },
          { date: '2024-01-03', severity: 3 },
          { date: '2024-01-04', severity: 4 },
          { date: '2024-01-05', severity: 5 },
        ],
        improvementTrend: 'deteriorating',
        recurringIssuePattern: [
          'ネットワーク遅延の問題',
          'データベース接続タイムアウト',
        ],
      }),
      calculateTeamMetrics: jest.fn().mockResolvedValue({
        teamId: 'combined',
        issueResolutionDaysAverage: 3.2,
        reportSubmissionRate: 92,
        issueRecurrenceRate: 18,
      }),
      generateExecutiveSummary: jest.fn().mockResolvedValue({
        topPriorityChallenges: [
          {
            challengeId: 'ch-001',
            priorityScore: 85,
            occurrenceFrequency: 6,
            impactLevel: '高',
            resolutionDaysAverage: 2.5,
          },
          {
            challengeId: 'ch-002',
            priorityScore: 75,
            occurrenceFrequency: 2,
            impactLevel: '中',
            resolutionDaysAverage: 3.0,
          },
        ],
        performanceMetrics: {
          teamId: 'combined',
          issueResolutionDaysAverage: 3.2,
          reportSubmissionRate: 92,
          issueRecurrenceRate: 18,
        },
        bottleneckTrend: {
          timeSeriesData: [
            { date: '2024-01-01', severity: 2 },
            { date: '2024-01-05', severity: 5 },
          ],
          improvementTrend: 'deteriorating',
          recurringIssuePattern: [
            'ネットワーク遅延の問題',
            'データベース接続タイムアウト',
          ],
        },
      }),
    };

    // テスト入力
    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-02-01T09:00:00Z'),
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // モックされたレポートデータ取得関数
    const mockGetReportsByMonth = jest
      .fn()
      .mockResolvedValue([...projectX_reports, ...projectY_reports]);
    const mockGetTeamsByManager = jest
      .fn()
      .mockResolvedValue([
        { teamId: projectX_teamId, teamName: 'Project X Team' },
        { teamId: projectY_teamId, teamName: 'Project Y Team' },
      ]);

    // エージェント実行
    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(agentInput, {
      aiClient: mockAiClient,
      notificationAdapter: mockNotificationAdapter,
      reportRepository: {
        getReportsByMonth: mockGetReportsByMonth,
        getReportsByTeamAndMonth: jest.fn().mockResolvedValue([]),
      },
      teamRepository: {
        getTeamsByManager: mockGetTeamsByManager,
        getTeamById: jest.fn().mockResolvedValue(null),
      },
      auditLogger: {
        log: jest.fn().mockResolvedValue(undefined),
      },
    });

    // 検証: reportIdが正常に生成されている
    expect(result.reportId).toBeTruthy();
    expect(result.reportId).toMatch(/^report-/);

    // 検証: executionStatusが成功
    expect(result.executionStatus).toBe('success');

    // 検証: deliveryTimestampが設定されている
    expect(result.deliveryTimestamp).toBeInstanceOf(Date);
    expect(result.deliveryTimestamp.getTime()).toBeGreaterThan(
      agentInput.triggerTimestamp.getTime()
    );

    // 検証: analysisResultSummaryが含まれている
    expect(result.analysisResultSummary).toBeDefined();
    expect(result.analysisResultSummary.topPriorityChallenges).toHaveLength(2);
    expect(result.analysisResultSummary.topPriorityChallenges[0].priorityScore).toBe(
      85
    );

    // 検証: ボトルネック推移が分析されている
    expect(
      result.analysisResultSummary.bottleneckTrend.timeSeriesData
    ).toHaveLength(2);
    expect(result.analysisResultSummary.bottleneckTrend.improvementTrend).toBe(
      'deteriorating'
    );

    // 検証: チーム別パフォーマンス指標が含まれている
    expect(result.analysisResultSummary.performanceMetrics).toBeDefined();
    expect(
      result.analysisResultSummary.performanceMetrics.issueResolutionDaysAverage
    ).toBe(3.2);
    expect(result.analysisResultSummary.performanceMetrics.reportSubmissionRate).toBe(
      92
    );

    // **最重要検証**: 部長Aへの通知が正確に1回のみ送出されている
    const managerNotifications = notificationSendCalls.filter(
      (call) => call.userId === managerUserId
    );
    expect(managerNotifications).toHaveLength(1);

    // 検証: 通知ペイロードに両プロジェクトの分析結果が含まれている
    const notificationMessage = managerNotifications[0].message;
    expect(notificationMessage).toContain('ネットワーク遅延の問題');
    expect(notificationMessage).toContain('優先度');
    expect(notificationMessage).toContain('2024-01');

    // 検証: sendReminderNotificationが部長に対してのみ呼び出されている
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      managerUserId,
      expect.any(String),
      expect.any(String)
    );

    // 検証: 呼び出し回数が正確に1回
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
  });
});