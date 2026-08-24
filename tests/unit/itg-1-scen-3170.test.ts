import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行', () => {
  let mockAiClient: jest.Mocked<Tx6Imp1AiClient>;
  let mockNotificationAdapter: any;
  let mockDatabaseAdapter: any;

  beforeEach(() => {
    mockAiClient = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    } as any;

    mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    mockDatabaseAdapter = {
      saveReport: jest.fn().mockResolvedValue({ reportId: 'rpt-001' }),
      updateReportStatus: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3170
  test('重大インシデント検出時にエスカレーション条件に該当し、副作用確定前に人へ引き継ぐ', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';
    const teamId = 'team-001';

    const reportDataset = [
      {
        reportId: 'report-001',
        date: '2024-01-08',
        engineer: 'engineer-001',
        yesterday: 'API開発を完了',
        today: 'テスト開始予定',
        issues: 'なし',
      },
      {
        reportId: 'report-002',
        date: '2024-01-09',
        engineer: 'engineer-002',
        yesterday: 'フロントエンド修正',
        today: 'レビュー待ち',
        issues: 'システム停止による業務中断。全サービス利用不可。復旧時間未定',
      },
      {
        reportId: 'report-003',
        date: '2024-01-10',
        engineer: 'engineer-003',
        yesterday: 'ドキュメント作成',
        today: '設定作業',
        issues: 'マイナーなバグ報告',
      },
      {
        reportId: 'report-004',
        date: '2024-01-11',
        engineer: 'engineer-004',
        yesterday: 'デプロイ実施',
        today: 'ホットフィックス対応',
        issues: 'ネットワーク遅延',
      },
      {
        reportId: 'report-005',
        date: '2024-01-12',
        engineer: 'engineer-005',
        yesterday: 'テスト完了',
        today: 'リリース準備',
        issues: 'データベース接続タイムアウト',
      },
    ];

    mockAiClient.extractKeywords.mockImplementation((text: string) => {
      if (text.includes('システム停止') && text.includes('全サービス利用不可')) {
        return {
          keywords: ['システム停止', '業務中断', 'サービス利用不可'],
          frequencies: [5, 3, 4],
        };
      }
      return { keywords: [], frequencies: [] };
    });

    mockAiClient.assessImpactScore.mockImplementation(
      (keyword: string, frequency: number) => {
        if (keyword === 'システム停止') {
          return 95;
        }
        return Math.min(50, frequency * 10);
      }
    );

    mockAiClient.classifyIssueSeverity.mockImplementation((text: string) => {
      if (
        text.includes('システム停止') &&
        text.includes('全サービス利用不可')
      ) {
        return {
          severity: 'critical',
          confidence: 0.98,
          reasoning: 'Multi-system outage with undefined recovery time',
        };
      }
      return { severity: 'low', confidence: 0.75, reasoning: '' };
    });

    const input = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    const result = await runTx6Imp1Agent(input, mockAiClient, {
      notificationAdapter: mockNotificationAdapter,
      databaseAdapter: mockDatabaseAdapter,
    });

    expect(result.escalationRequired).toBe(true);
    expect(result.escalationType).toBe('CRITICAL_INCIDENT_DETECTED');
    expect(result.pendingAction).toBe('HUMAN_REVIEW_REQUIRED');
    expect(result.detectedIssue).toBeDefined();
    expect(result.detectedIssue.id).toBe('incident-001');
    expect(result.detectedIssue.severity).toBe('critical');
    expect(result.detectedIssue.description).toContain('システム停止');
    expect(result.detectedIssue.description).toContain('全サービス利用不可');
    expect(result.detectedIssue.recommendedAction).toBe(
      '部長への即時報告と経営判断が必要'
    );

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockDatabaseAdapter.saveReport).not.toHaveBeenCalled();
    expect(mockDatabaseAdapter.updateReportStatus).not.toHaveBeenCalled();

    expect(result.reportId).toBeUndefined();
    expect(result.reportGeneratedAt).toBeUndefined();
    expect(result.emailSentAt).toBeUndefined();
  });
});