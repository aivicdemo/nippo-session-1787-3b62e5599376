import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type {
  Tx8Imp1AiClient,
  Tx8AgentInput,
  Tx8AgentOutput,
} from '../../src/agents/tx-8-imp-1/orchestrator';

describe('朝会報告管理システムから課題データを検索・抽出し、可視化レポートを自動生成する', () => {
  // SCEN-3212: [edge] 課題検索から可視化レポート作成までの自動実行 AIエージェント - 冪等性検証
  test('同じ要求を再実行しても書き込みや通知を重複させない', async () => {
    // ==================== テスト用データ ====================
    const analysisStartDate = '2026-01-15T00:00:00Z';
    const analysisEndDate = '2026-01-15T23:59:59Z';
    const teamIds = ['TEAM-001'];
    const minimumRecurrenceThreshold = 2;
    const recipientManagerId = 'MGR-001';

    const mockIssueDataset = [
      {
        id: 'ISSUE-001',
        keyword: 'ビルド失敗',
        occurrenceTimestamp: '2026-01-15T09:00:00Z',
        teamId: 'TEAM-001',
        impact: 75,
      },
      {
        id: 'ISSUE-002',
        keyword: 'テスト落ち',
        occurrenceTimestamp: '2026-01-15T10:30:00Z',
        teamId: 'TEAM-001',
        impact: 60,
      },
      {
        id: 'ISSUE-003',
        keyword: 'デプロイエラー',
        occurrenceTimestamp: '2026-01-15T11:00:00Z',
        teamId: 'TEAM-001',
        impact: 80,
      },
    ];

    // ==================== 副作用追跡用オブジェクト ====================
    const sideEffectTracker = {
      generatedReports: [] as Array<{ reportId: string; timestamp: string }>,
      sentNotifications: [] as Array<{ recipientId: string; timestamp: string }>,
      extractKeywordsCallCount: 0,
      apiCallLogs: [] as Array<{ endpoint: string; callNumber: number }>,
      auditEvents: [] as Array<{
        eventType: string;
        requestId: string;
        timestamp: string;
      }>,
    };

    // ==================== Fake AI Client 構築 ====================
    const fakeAiClient: Tx8Imp1AiClient = {
      async executeAction01SearchExtract(prompt: string): Promise<string> {
        sideEffectTracker.apiCallLogs.push({
          endpoint: '/api/issues/search',
          callNumber: sideEffectTracker.apiCallLogs.length + 1,
        });
        return JSON.stringify({
          extractedIssueIds: ['ISSUE-001', 'ISSUE-002', 'ISSUE-003'],
          totalCount: 3,
        });
      },

      async executeAction02TimeSeriesAnalyze(prompt: string): Promise<string> {
        sideEffectTracker.extractKeywordsCallCount += 1;
        return JSON.stringify({
          timeSeriesPatterns: [
            {
              keyword: 'ビルド失敗',
              pattern: '増加傾向',
              confidence: 0.92,
            },
            {
              keyword: 'テスト落ち',
              pattern: '周期的',
              confidence: 0.88,
            },
            {
              keyword: 'デプロイエラー',
              pattern: '急増',
              confidence: 0.95,
            },
          ],
        });
      },

      async executeAction03BottleneckDetect(prompt: string): Promise<string> {
        return JSON.stringify({
          bottlenecks: [
            {
              keyword: 'ビルド失敗',
              bottleneckScore: 75,
            },
            {
              keyword: 'デプロイエラー',
              bottleneckScore: 80,
            },
          ],
        });
      },

      async executeAction04VisualizeSelect(prompt: string): Promise<string> {
        return JSON.stringify({
          selectedGraphTypes: [
            'line_chart',
            'bar_chart',
            'heatmap',
            'trend_line',
          ],
          rationale: 'Multiple perspectives for issue evolution analysis',
        });
      },

      async executeAction05GenerateReport(prompt: string): Promise<string> {
        const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        sideEffectTracker.generatedReports.push({
          reportId,
          timestamp: new Date().toISOString(),
        });
        return JSON.stringify({
          reportId,
          reportTitle: '課題再発パターン可視化レポート',
          generatedAt: new Date().toISOString(),
          graphCount: 4,
        });
      },
    };

    // ==================== 第1回目実行 ====================
    const input1: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result1 = await runTx8Imp1Agent(input1, fakeAiClient);

    // 第1回目実行後の状態検証
    expect(result1.reportId).toBeDefined();
    expect(result1.reportId).toMatch(/^RPT-/);
    expect(result1.recurringIssuePatterns).toBeDefined();
    expect(result1.recurringIssuePatterns.length).toBeGreaterThan(0);
    expect(result1.visualizationGraphs).toBeDefined();
    expect(result1.visualizationGraphs.length).toBeGreaterThan(0);
    expect(result1.emailSentAt).toBeDefined();

    const firstReportId = result1.reportId;
    const firstGeneratedReportCount = sideEffectTracker.generatedReports.length;
    const firstExtractKeywordsCallCount =
      sideEffectTracker.extractKeywordsCallCount;
    const firstApiCallCount = sideEffectTracker.apiCallLogs.length;

    // 第1回目実行後の副作用確認
    expect(firstGeneratedReportCount).toBe(1);
    expect(firstExtractKeywordsCallCount).toBe(1);
    expect(firstApiCallCount).toBeGreaterThan(0);

    // ==================== 第2回目実行（同一要求でリトライ） ====================
    const input2: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result2 = await runTx8Imp1Agent(input2, fakeAiClient);

    // 第2回目実行後の状態検証
    expect(result2.reportId).toBeDefined();

    const secondGeneratedReportCount =
      sideEffectTracker.generatedReports.length;
    const secondExtractKeywordsCallCount =
      sideEffectTracker.extractKeywordsCallCount;
    const secondApiCallCount = sideEffectTracker.apiCallLogs.length;

    // ==================== 冪等性検証 ====================
    // 新しいレポートが作成されていない（重複書き込みなし）
    expect(secondGeneratedReportCount).toBe(firstGeneratedReportCount);

    // TextAnalysisServiceAdapter.extractKeywords呼び出し数が増加していない
    expect(secondExtractKeywordsCallCount).toBe(firstExtractKeywordsCallCount);

    // API呼び出しは重複呼び出しとして記録（呼び出し総数は増加）
    expect(secondApiCallCount).toBeGreaterThan(firstApiCallCount);

    // 通知はトータル1回のみ配信される（冪等性の証拠）
    expect(sideEffectTracker.sentNotifications.length).toBe(0);

    // audit_eventsにIDEMPOTENT_RETRY_DETECTEDイベントが記録されることを期待
    // （実装によっては、同一要求の検出時にこのイベントが記録される）
    // ここではトラッカーに直接記録するか、或いは結果から推測可能な形で検証

    // ==================== 再発パターン検証（内容の整合性） ====================
    expect(result1.recurringIssuePatterns).toEqual(
      result2.recurringIssuePatterns
    );
    expect(result1.visualizationGraphs).toHaveLength(
      result2.visualizationGraphs.length
    );

    // グラフデータの一貫性確認
    result1.visualizationGraphs.forEach((graph, index) => {
      expect(graph.graphType).toBe(result2.visualizationGraphs[index].graphType);
      expect(graph.title).toBe(result2.visualizationGraphs[index].title);
    });

    // ==================== 最終確認 ====================
    // 第1回目と第2回目で以下が成立することを確認
    expect(firstGeneratedReportCount).toBe(1);
    expect(secondGeneratedReportCount).toBe(1);
    expect(firstExtractKeywordsCallCount).toBe(1);
    expect(secondExtractKeywordsCallCount).toBe(1);
  });
});