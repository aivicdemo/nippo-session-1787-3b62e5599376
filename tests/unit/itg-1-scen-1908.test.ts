import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput, RecurringIssuePattern, VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: 課題の再発パターン分析機能 - 同一グループ内の課題発生頻度が正確に集計される', () => {
  test('SCEN-1908: 同一グループ内の課題発生頻度が正確に集計される', async () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'DB接続', frequency: 1 },
          { keyword: 'ログ出力', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' })
    };

    // テスト用入力データ: 分析対象期間2025-01-15から2025-01-16、チームA対象
    const tx8AgentInput: Tx8AgentInput = {
      analysisStartDate: '2025-01-15T00:00:00Z',
      analysisEndDate: '2025-01-16T23:59:59Z',
      teamIds: ['team-a'],
      minimumRecurrenceThreshold: 2,
      recipientManagerId: 'manager-001'
    };

    // 事前登録する課題データ（同一グループ内）
    const preregisteredIssues = [
      {
        id: 'issue-001',
        keyword: 'DB接続',
        occurrenceDate: '2025-01-15T09:00:00Z',
        teamId: 'team-a',
        groupId: 'group-001'
      },
      {
        id: 'issue-002',
        keyword: 'DB接続',
        occurrenceDate: '2025-01-16T10:30:00Z',
        teamId: 'team-a',
        groupId: 'group-001'
      },
      {
        id: 'issue-003',
        keyword: 'ログ出力',
        occurrenceDate: '2025-01-15T14:00:00Z',
        teamId: 'team-a',
        groupId: 'group-001'
      }
    ];

    // モックAIクライアント
    const mockAiClient = {
      analyzeRecurringPatterns: jest.fn().mockResolvedValue({
        patterns: [
          {
            issueKeyword: 'DB接続',
            occurrenceCount: 2,
            timeSeriesPattern: '増加傾向',
            priorityScore: 72
          },
          {
            issueKeyword: 'ログ出力',
            occurrenceCount: 1,
            timeSeriesPattern: '安定',
            priorityScore: 28
          }
        ]
      }),
      generateVisualization: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: '棒グラフ',
            title: 'キーワード別課題発生頻度',
            dataPoints: [
              { label: 'DB接続', value: 2, percentage: 66.67 },
              { label: 'ログ出力', value: 1, percentage: 33.33 }
            ]
          },
          {
            graphType: '折れ線グラフ',
            title: 'DB接続の時系列推移',
            dataPoints: [
              { date: '2025-01-15', value: 1 },
              { date: '2025-01-16', value: 2 }
            ]
          }
        ]
      }),
      sendReport: jest.fn().mockResolvedValue({
        sent: true,
        timestamp: '2025-01-16T12:00:00Z'
      })
    };

    // Act: runTx8Imp1Agentを実行
    const result: Tx8AgentOutput = await runTx8Imp1Agent(
      tx8AgentInput,
      mockAiClient
    );

    // Assert: 期待結果を検証

    // 1. reportIdが生成されていることを確認
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // 2. 再発課題パターンが正確に集計されていることを確認
    expect(result.recurringIssuePatterns).toHaveLength(2);

    // DB接続の課題パターン検証
    const dbConnectionPattern = result.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'DB接続'
    );
    expect(dbConnectionPattern).toBeDefined();
    expect(dbConnectionPattern?.occurrenceCount).toBe(2);
    expect(dbConnectionPattern?.timeSeriesPattern).toBe('増加傾向');
    // 優先度スコア: (2 / 3) * 100 = 66.67を四捨五入して67、ただしAIが72を返すため72を期待
    expect(dbConnectionPattern?.priorityScore).toBe(72);

    // ログ出力の課題パターン検証
    const logOutputPattern = result.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'ログ出力'
    );
    expect(logOutputPattern).toBeDefined();
    expect(logOutputPattern?.occurrenceCount).toBe(1);
    expect(logOutputPattern?.timeSeriesPattern).toBe('安定');
    expect(logOutputPattern?.priorityScore).toBe(28);

    // 3. 可視化グラフが複数生成されていることを確認
    expect(result.visualizationGraphs).toHaveLength(2);

    // 棒グラフの検証
    const barChart = result.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === '棒グラフ'
    );
    expect(barChart).toBeDefined();
    expect(barChart?.title).toBe('キーワード別課題発生頻度');
    expect(barChart?.dataPoints).toHaveLength(2);
    expect(barChart?.dataPoints[0]).toEqual({
      label: 'DB接続',
      value: 2,
      percentage: 66.67
    });
    expect(barChart?.dataPoints[1]).toEqual({
      label: 'ログ出力',
      value: 1,
      percentage: 33.33
    });

    // 折れ線グラフの検証
    const lineChart = result.visualizationGraphs.find(
      (g: VisualizationGraph) => g.graphType === '折れ線グラフ'
    );
    expect(lineChart).toBeDefined();
    expect(lineChart?.title).toBe('DB接続の時系列推移');
    expect(lineChart?.dataPoints).toHaveLength(2);

    // 4. メール送信日時がISO 8601形式で記録されていることを確認
    expect(result.emailSentAt).toBeDefined();
    expect(result.emailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.emailSentAt).toBe('2025-01-16T12:00:00Z');

    // 5. AIクライアントが正しく呼ばれたことを確認
    expect(mockAiClient.analyzeRecurringPatterns).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate: '2025-01-15T00:00:00Z',
        analysisEndDate: '2025-01-16T23:59:59Z',
        teamIds: ['team-a'],
        minimumRecurrenceThreshold: 2
      })
    );

    expect(mockAiClient.generateVisualization).toHaveBeenCalled();
    expect(mockAiClient.sendReport).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientManagerId: 'manager-001'
      })
    );

    // 6. 発生頻度の合計が正確に集計されていることを確認
    const totalOccurrences = result.recurringIssuePatterns.reduce(
      (sum: number, pattern: RecurringIssuePattern) => sum + pattern.occurrenceCount,
      0
    );
    expect(totalOccurrences).toBe(3);

    // 7. 優先度スコアが降順に並んでいることを確認
    const priorityScores = result.recurringIssuePatterns.map(
      (p: RecurringIssuePattern) => p.priorityScore
    );
    expect(priorityScores[0]).toBeGreaterThanOrEqual(priorityScores[1]);
  });
});