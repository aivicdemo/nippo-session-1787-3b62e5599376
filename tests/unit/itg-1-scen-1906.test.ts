import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1906: [normal] 課題の再発パターン分析機能 - 過去30日の課題データから同一キーワードの課題が同一グループとして認識される
  test('should group issues by identical keyword with minimum recurrence threshold met', async () => {
    // ========================================
    // Setup: テストデータの準備
    // ========================================
    const analysisStartDate = '2024-12-01T00:00:00Z';
    const analysisEndDate = '2024-12-31T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'manager-001';

    // 過去30日間の課題データを模擬
    // 同一キーワード「DB接続エラー」を含む課題: 5件
    const dbConnectionIssues = [
      {
        issueId: 'issue-001',
        keyword: 'DB接続エラー',
        occurrenceDate: '2024-12-05T09:30:00Z',
        description: 'Database connection timeout occurred in production',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-002',
        keyword: 'DB接続エラー',
        occurrenceDate: '2024-12-10T14:15:00Z',
        description: 'DB接続エラーが再度発生',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-003',
        keyword: 'DB接続エラー',
        occurrenceDate: '2024-12-15T11:00:00Z',
        description: 'Database connection pool exhausted',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-004',
        keyword: 'DB接続エラー',
        occurrenceDate: '2024-12-20T16:45:00Z',
        description: 'Connection refused from database server',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-005',
        keyword: 'DB接続エラー',
        occurrenceDate: '2024-12-25T10:30:00Z',
        description: 'Another DB connection failure',
        teamId: 'team-001'
      }
    ];

    // 異なるキーワードを含む課題: 3件
    const otherIssues = [
      {
        issueId: 'issue-006',
        keyword: 'メモリリーク',
        occurrenceDate: '2024-12-08T13:20:00Z',
        description: 'Memory usage keeps increasing',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-007',
        keyword: 'パフォーマンス低下',
        occurrenceDate: '2024-12-12T15:00:00Z',
        description: 'Response time degradation detected',
        teamId: 'team-001'
      },
      {
        issueId: 'issue-008',
        keyword: 'ネットワークタイムアウト',
        occurrenceDate: '2024-12-18T12:30:00Z',
        description: 'Network request timeout',
        teamId: 'team-001'
      }
    ];

    const allIssues = [...dbConnectionIssues, ...otherIssues];

    // ========================================
    // Mock: TextAnalysisServiceAdapter と その他のサービス
    // ========================================
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        // DB接続エラーに関するテキストから「DB接続エラー」キーワードを抽出
        if (
          text.includes('Database connection') ||
          text.includes('DB接続エラー') ||
          text.includes('connection pool') ||
          text.includes('Connection refused') ||
          text.includes('connection failure')
        ) {
          return {
            keywords: ['DB接続エラー'],
            frequencies: [5],
            confidence: 0.95
          };
        }
        // その他のキーワードの場合は適切に返す
        if (text.includes('Memory')) return { keywords: ['メモリリーク'], frequencies: [1], confidence: 0.88 };
        if (text.includes('Response time')) return { keywords: ['パフォーマンス低下'], frequencies: [1], confidence: 0.85 };
        if (text.includes('Network')) return { keywords: ['ネットワークタイムアウト'], frequencies: [1], confidence: 0.90 };
        return { keywords: [], frequencies: [], confidence: 0.0 };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        const scoreMap: Record<string, number> = {
          'DB接続エラー': 85,
          'メモリリーク': 70,
          'パフォーマンス低下': 75,
          'ネットワークタイムアウト': 65
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        if (text.includes('Database connection') || text.includes('DB接続エラー')) return 'high';
        if (text.includes('Memory') || text.includes('Response time')) return 'medium';
        return 'low';
      })
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({ success: true, deliveryStatus: 'sent' })),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'delivered' }))
    };

    const mockReportRepository = {
      findIssuesInDateRange: jest.fn(async (startDate: string, endDate: string, teamIds: string[]) => {
        return allIssues.filter((issue) => issue.occurrenceDate >= startDate && issue.occurrenceDate <= endDate);
      }),
      saveAnalysisReport: jest.fn(async (report: any) => ({
        reportId: `report-${Date.now()}`,
        ...report
      })),
      saveRecurringPattern: jest.fn(async (pattern: any) => ({
        patternId: `pattern-${Date.now()}`,
        ...pattern
      }))
    };

    // ========================================
    // Execute: 関数呼び出し
    // ========================================
    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId
    };

    const aiClientInterface = {
      extractKeywords: mockTextAnalysisAdapter.extractKeywords,
      assessImpactScore: mockTextAnalysisAdapter.assessImpactScore,
      classifyIssueSeverity: mockTextAnalysisAdapter.classifyIssueSeverity,
      sendNotification: mockNotificationAdapter.sendReminderNotification,
      saveReport: mockReportRepository.saveAnalysisReport,
      findIssues: mockReportRepository.findIssuesInDateRange,
      savePattern: mockReportRepository.saveRecurringPattern
    };

    const result = await runTx8Imp1Agent(input, aiClientInterface);

    // ========================================
    // Verify: 期待値との比較
    // ========================================
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    // 再発パターンが正しく生成されていることを確認
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);

    // DB接続エラーの再発パターンを検索
    const dbConnectionPattern = result.recurringIssuePatterns.find(
      (pattern) => pattern.issueKeyword === 'DB接続エラー'
    );

    // DB接続エラーが1つのグループとして認識されているか確認
    expect(dbConnectionPattern).toBeDefined();
    
    // グループ化された課題の件数が5件であることを検証
    expect(dbConnectionPattern?.occurrenceCount).toBe(5);
    
    // 優先度スコアが高いこと（影響度が高いため）
    expect(dbConnectionPattern?.priorityScore).toBeGreaterThanOrEqual(80);
    expect(dbConnectionPattern?.priorityScore).toBeLessThanOrEqual(100);

    // 時系列パターンが取得されているか確認
    expect(dbConnectionPattern?.timeSeriesPattern).toBeDefined();
    expect(['増加傾向', '周期的', '急増', '継続的'].some((pattern) => 
      dbConnectionPattern?.timeSeriesPattern.includes(pattern)
    )).toBe(true);

    // 異なるキーワードの課題が別グループとして分類されていることを確認
    const otherPatterns = result.recurringIssuePatterns.filter(
      (pattern) => pattern.issueKeyword !== 'DB接続エラー'
    );
    
    expect(otherPatterns.length).toBeGreaterThanOrEqual(0);
    
    // 各パターンの発生回数が1回以上であることを確認
    otherPatterns.forEach((pattern) => {
      expect(pattern.occurrenceCount).toBeGreaterThanOrEqual(1);
    });

    // 可視化グラフが生成されていることを確認
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    // グラフにはデータポイントが含まれていることを確認
    result.visualizationGraphs.forEach((graph) => {
      expect(graph.graphType).toBeDefined();
      expect(['折れ線', '棒', '円', 'ヒートマップ'].includes(graph.graphType)).toBe(true);
      expect(graph.title).toBeDefined();
      expect(graph.dataPoints).toBeDefined();
      expect(Array.isArray(graph.dataPoints)).toBe(true);
    });

    // メール送信が実行されたことを確認
    expect(result.emailSentAt).toBeDefined();
    expect(new Date(result.emailSentAt).getTime()).toBeLessThanOrEqual(new Date().getTime());

    // TextAnalysisServiceAdapter が正しく呼ばれていることを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});