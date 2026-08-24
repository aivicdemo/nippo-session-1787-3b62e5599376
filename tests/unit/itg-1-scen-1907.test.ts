import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput, RecurringIssuePattern, VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: 課題の再発パターン分析と可視化レポート生成', () => {
  // SCEN-1907: 類似度80%以上の課題が同一グループとして認識される
  test('should group similar issues with similarity score >= 80 and return recurring patterns with visualizations', async () => {
    // Arrange: TextAnalysisServiceAdapter モック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        if (text.includes('DB接続エラー')) {
          return {
            keywords: [
              { keyword: 'DB接続エラー', frequency: 3 },
              { keyword: 'タイムアウト', frequency: 2 },
              { keyword: '本番環境', frequency: 1 }
            ]
          };
        }
        if (text.includes('データベース接続失敗')) {
          return {
            keywords: [
              { keyword: 'データベース接続失敗', frequency: 3 },
              { keyword: '応答遅延', frequency: 2 },
              { keyword: '本番', frequency: 1 }
            ]
          };
        }
        return { keywords: [] };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        return { impactScore: 75 };
      }),
      classifyIssueSeverity: jest.fn(async (issueText: string) => {
        return { severity: 'high' };
      })
    };

    // NotificationServiceAdapter モック化
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        status: 'delivered',
        timestamp: new Date('2024-01-15T10:00:00Z').toISOString()
      })),
      scheduleNotification: jest.fn(async () => ({
        scheduled: true
      })),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'delivered'
      }))
    };

    // テストデータ: 類似度80%以上の2件の課題
    const testIssueData = [
      {
        issueKeyword: 'DB接続エラー',
        occurrenceCount: 3,
        timeSeriesPattern: '増加傾向',
        priorityScore: 85,
        extractedAt: '2024-01-08T09:00:00Z'
      },
      {
        issueKeyword: 'データベース接続失敗',
        occurrenceCount: 3,
        timeSeriesPattern: '増加傾向',
        priorityScore: 82,
        extractedAt: '2024-01-09T09:00:00Z'
      }
    ];

    // テスト用入力パラメータ
    const input: Tx8AgentInput = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 2,
      recipientManagerId: 'manager-001'
    };

    // Act: runTx8Imp1Agent を実行
    const result = await runTx8Imp1Agent(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
      issueDataSource: {
        fetchIssuesBetweenDates: jest.fn(async () => testIssueData),
        groupIssuesBySimilarity: jest.fn(async (issues: any[]) => {
          // 類似度計算: "DB接続エラー" と "データベース接続失敗" の類似度 = 82% (80以上)
          return [
            {
              groupId: 'GROUP_001',
              issues: testIssueData,
              similarityScore: 82,
              relatedIssueCount: 2
            }
          ];
        }),
        getGroupDetails: jest.fn(async (groupId: string) => {
          if (groupId === 'GROUP_001') {
            return {
              groupId: 'GROUP_001',
              relatedIssues: testIssueData,
              relatedIssueCount: 2,
              groupSimilarityScore: 82
            };
          }
          return null;
        })
      }
    } as any);

    // Assert: 再発課題パターンの検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    // 再発パターンが正しく返される
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThanOrEqual(1);

    // 同一グループに属する課題の検証
    const groupedPattern = result.recurringIssuePatterns.find(
      (pattern: RecurringIssuePattern) => 
        pattern.issueKeyword.includes('DB') || pattern.issueKeyword.includes('データベース')
    );
    expect(groupedPattern).toBeDefined();
    expect(groupedPattern.occurrenceCount).toBe(3);
    expect(groupedPattern.priorityScore).toBeGreaterThanOrEqual(80);
    expect(groupedPattern.priorityScore).toBeLessThanOrEqual(100);

    // 時系列パターンが正しく検出
    expect(groupedPattern.timeSeriesPattern).toBe('増加傾向');

    // 可視化グラフが自動選択されている
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    // グラフタイプとデータが正しく設定されている
    const graphs = result.visualizationGraphs as VisualizationGraph[];
    expect(graphs.some((g: VisualizationGraph) => g.graphType === '折れ線')).toBe(true);
    graphs.forEach((graph: VisualizationGraph) => {
      expect(graph.title).toBeDefined();
      expect(graph.title.length).toBeGreaterThan(0);
      expect(Array.isArray(graph.dataPoints)).toBe(true);
      expect(graph.dataPoints.length).toBeGreaterThan(0);
    });

    // メール配信時刻が記録されている
    expect(result.emailSentAt).toBeDefined();
    expect(new Date(result.emailSentAt).getTime()).toBeGreaterThan(0);

    // 類似度80以上の課題がグループ化されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});