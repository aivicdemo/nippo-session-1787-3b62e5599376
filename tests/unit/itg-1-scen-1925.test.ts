import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput, RecurringIssuePattern, VisualizationGraph } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題の再発パターン分析機能', () => {
  // SCEN-1925: [edge] 過去30日間のデータがちょうど30日分存在する場合、全課題がグループ化対象として処理される
  test('should treat all 30 issues as grouping targets when exactly 30 days of data exist', async () => {
    // Arrange: 基準時刻Tを定義
    const baselineDate = new Date('2024-01-31T09:00:00Z');
    const thirtyDaysAgoDate = new Date('2024-01-01T09:00:00Z');

    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // 各日報テキストから課題キーワードを抽出
        const keywords = text.match(/課題_\d+/g) || [];
        return Promise.resolve(
          keywords.map((kw) => ({
            keyword: kw,
            frequency: 1,
          }))
        );
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        // 課題の影響度スコアを0-100の範囲で返す
        return Promise.resolve(parseInt(keyword.split('_')[1]) % 100);
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        return Promise.resolve('中' as const);
      }),
    };

    // NotificationServiceAdapterのモック化
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(() =>
        Promise.resolve({ sent: true, deliveryStatus: 'success' })
      ),
      scheduleNotification: jest.fn(() => Promise.resolve({ scheduled: true })),
      getDeliveryStatus: jest.fn(() =>
        Promise.resolve({ status: 'delivered', sentAt: baselineDate.toISOString() })
      ),
    };

    // テスト入力を構築
    const input: Tx8AgentInput = {
      analysisStartDate: thirtyDaysAgoDate.toISOString(),
      analysisEndDate: baselineDate.toISOString(),
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 1,
      recipientManagerId: 'manager-001',
    };

    // 模擬課題データセット: 30日間、各日1件ずつ異なる課題キーワード
    const mockIssueDataset = Array.from({ length: 30 }, (_, index) => ({
      issueKeyword: `課題_${(index + 1) % 100}`,
      occurrenceCount: 1,
      timeSeriesPattern: '単発',
      priorityScore: (index + 1) % 100,
      reportDate: new Date(
        baselineDate.getTime() - (30 - index - 1) * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    // Mock実行: runTx8Imp1Agentを呼び出し
    // Note: 実装の詳細に応じて、以下のモック設定は調整が必要
    const mockFetchResponse = {
      ok: true,
      json: async () => ({
        recurringIssuePatterns: mockIssueDataset,
        visualizationGraphs: [
          {
            graphType: 'line',
            title: '課題発生頻度の推移',
            dataPoints: mockIssueDataset.map((issue) => ({
              date: issue.reportDate,
              value: issue.occurrenceCount,
            })),
          },
        ] as VisualizationGraph[],
      }),
      status: 200,
    };

    global.fetch = jest.fn(() => Promise.resolve(mockFetchResponse as Response));

    // Act: エージェントを実行
    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockTextAnalysisAdapter);

    // Assert: 全30件の課題がグループ化対象として処理されていることを検証
    // グループ化対象: priorityScore > 0 かつ timeSeriesPattern が null でない課題
    const groupingTargets = result.recurringIssuePatterns.filter(
      (pattern) => pattern.priorityScore > 0 && pattern.timeSeriesPattern !== null
    );

    expect(groupingTargets).toHaveLength(30);

    // 各課題にグループID相当の識別子が割り当てられていることを検証
    groupingTargets.forEach((pattern) => {
      expect(pattern.issueKeyword).toBeDefined();
      expect(typeof pattern.issueKeyword).toBe('string');
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
    });

    // グループ化対象外の課題件数が0件であることを確認
    const nonGroupingTargets = result.recurringIssuePatterns.filter(
      (pattern) => pattern.priorityScore === 0 || pattern.timeSeriesPattern === null
    );

    expect(nonGroupingTargets).toHaveLength(0);

    // レポート生成確認
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');

    // ビジュアライゼーション確認
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    result.visualizationGraphs.forEach((graph) => {
      expect(graph.graphType).toBeDefined();
      expect(graph.title).toBeDefined();
      expect(Array.isArray(graph.dataPoints)).toBe(true);
    });
  });
});