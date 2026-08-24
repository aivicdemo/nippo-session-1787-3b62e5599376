import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('朝会報告システム - 課題再発パターン分析 (Tx8)', () => {
  // SCEN-1927: [edge] 課題の再発パターン分析機能 - 過去31日分のデータ（30日超）を処理する際、30日超分のデータが全て対象に含まれる
  test('should include all 31 days of issue data in recurring pattern analysis when analysisEndDate minus analysisStartDate exceeds 30 days', async () => {
    // Arrange: テストデータとして現在日時から遡って31日分の課題レコードを生成
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const analysisStartDate = '2024-01-01T00:00:00Z'; // 31日間のデータ
    const teamIds = ['team-alpha'];
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'manager-001';

    // テストデータ: 31日分の課題データを構築
    // Day 1 (2024-01-01): issues on "Database Performance", "API Timeout"
    // Day 2 (2024-01-02): issues on "Database Performance", "Memory Leak"
    // ... (省略)
    // Day 31 (2024-01-31): issues on "Database Performance", "Deployment Failure"
    const expectedRecordCount = 62; // 31日 × 2課題/日 = 62レコード
    const oldestExpectedDate = new Date('2024-01-01T00:00:00Z');
    const newestExpectedDate = new Date('2024-01-31T23:59:59Z');

    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'Database Performance', frequency: 25 },
          { keyword: 'API Timeout', frequency: 18 },
          { keyword: 'Memory Leak', frequency: 12 },
          { keyword: 'Deployment Failure', frequency: 7 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        'Database Performance': 85,
        'API Timeout': 72,
        'Memory Leak': 68,
        'Deployment Failure': 45
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        'Database Performance': 'high',
        'API Timeout': 'high',
        'Memory Leak': 'medium',
        'Deployment Failure': 'low'
      })
    };

    // NotificationServiceAdapterのモック化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        sentAt: '2024-01-31T09:00:00Z'
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-123',
        scheduledFor: '2024-02-01T08:30:00Z'
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredCount: 10
      })
    };

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId
    };

    // Act: 課題の再発パターン分析機能を実行
    const output: Tx8AgentOutput = await runTx8Imp1Agent(input, {
      textAnalysisService: mockTextAnalysisServiceAdapter,
      notificationService: mockNotificationServiceAdapter
    });

    // Assert: 分析結果の検証
    expect(output.reportId).toBeDefined();
    expect(typeof output.reportId).toBe('string');
    expect(output.reportId.length).toBeGreaterThan(0);

    // 再発課題パターンの検証
    expect(output.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(output.recurringIssuePatterns)).toBe(true);
    expect(output.recurringIssuePatterns.length).toBeGreaterThan(0);

    // 各再発課題パターンの検証
    const recurringPatterns = output.recurringIssuePatterns;
    expect(recurringPatterns[0].issueKeyword).toBe('Database Performance');
    expect(recurringPatterns[0].occurrenceCount).toBe(25); // 25日間検出
    expect(recurringPatterns[0].priorityScore).toBe(85); // 影響度スコア
    expect(['increase', 'periodic', 'spike']).toContain(recurringPatterns[0].timeSeriesPattern);

    expect(recurringPatterns[1].issueKeyword).toBe('API Timeout');
    expect(recurringPatterns[1].occurrenceCount).toBe(18);
    expect(recurringPatterns[1].priorityScore).toBe(72);

    // 可視化グラフの検証
    expect(output.visualizationGraphs).toBeDefined();
    expect(Array.isArray(output.visualizationGraphs)).toBe(true);
    expect(output.visualizationGraphs.length).toBeGreaterThanOrEqual(1);

    const graph: VisualizationGraph = output.visualizationGraphs[0];
    expect(graph.graphType).toBeDefined();
    expect(['line', 'bar', 'pie', 'heatmap']).toContain(graph.graphType);
    expect(graph.title).toBeDefined();
    expect(typeof graph.title).toBe('string');
    expect(graph.dataPoints).toBeDefined();
    expect(Array.isArray(graph.dataPoints)).toBe(true);
    expect(graph.dataPoints.length).toBeGreaterThan(0);

    // メール送信日時の検証
    expect(output.emailSentAt).toBeDefined();
    expect(typeof output.emailSentAt).toBe('string');
    const emailSentDate = new Date(output.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);

    // 31日間のデータがすべて含まれていることを確認
    // グラフのデータポイントから日付範囲を検証
    const dataPointDates = graph.dataPoints
      .filter((dp: any) => dp.date)
      .map((dp: any) => new Date(dp.date));

    if (dataPointDates.length > 0) {
      const minDate = new Date(Math.min(...dataPointDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dataPointDates.map(d => d.getTime())));

      // 最も古いレコードが1月1日であることを確認
      expect(minDate.toISOString().split('T')[0]).toBe('2024-01-01');

      // 最も新しいレコードが1月31日であることを確認
      expect(maxDate.toISOString().split('T')[0]).toBe('2024-01-31');

      // 31日間すべてのデータが処理されていることを検証
      const daySpan = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daySpan).toBe(30); // 31日間 = 30日間のスパン
    }

    // 最小再発回数の閾値を超えている課題のみが含まれることを確認
    recurringPatterns.forEach((pattern: RecurringIssuePattern) => {
      expect(pattern.occurrenceCount).toBeGreaterThanOrEqual(minimumRecurrenceThreshold);
    });

    // TextAnalysisServiceが呼ばれたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});