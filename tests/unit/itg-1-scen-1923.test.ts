import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern, type VisualizationGraph } from '../../src/agents/tx-8-imp-1/types';

describe('TX8 再発パターン可視化レポート生成エージェント', () => {
  // SCEN-1923
  test('TextAnalysisServiceAdapterの類似度判定が失敗したときキャッシュから前回分析結果を返す', async () => {
    // キャッシュに前回の分析結果を登録
    const cachedAnalysisResult = {
      issueKeyword: 'DB接続',
      severity: '高',
      impactScore: 85,
      cachedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    };

    // TextAnalysisServiceAdapterのスタブ：classifyIssueSeverity()が失敗するように設定
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ term: 'DB接続', frequency: 3 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 85,
        confidence: 0.92,
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockRejectedValue(new Error('TextAnalysisService unavailable')),
    };

    // キャッシュを模擬：前回の分析結果を保持するメモリストア
    const cacheStore = {
      'データベース接続エラー': cachedAnalysisResult,
    };

    // 入力データの準備
    const agentInput: Tx8AgentInput = {
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-14',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    // エージェント実行時に渡すAIクライアント（スタブ）
    const aiClientStub = {
      analyzeIssueText: jest
        .fn()
        .mockResolvedValue({
          issues: [
            {
              keyword: 'DB接続',
              occurrenceCount: 3,
              severity: '高',
              impactScore: 85,
            },
          ],
          analysisTimestamp: new Date('2024-01-15T11:00:00Z').toISOString(),
        }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: '折れ線',
            title: 'DB接続エラー発生頻度の推移',
            dataPoints: [
              { date: '2024-01-08', count: 1 },
              { date: '2024-01-09', count: 1 },
              { date: '2024-01-14', count: 1 },
            ],
          },
        ],
      }),
      buildRecurringIssuePatterns: jest.fn().mockResolvedValue({
        patterns: [
          {
            issueKeyword: 'DB接続',
            occurrenceCount: 3,
            timeSeriesPattern: '週内分散型',
            priorityScore: 85,
          },
        ],
      }),
    };

    // エージェント実行
    const result = await runTx8Imp1Agent(agentInput, aiClientStub);

    // 戻り値の検証
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // 再発パターンの検証：キャッシュから返却された結果を確認
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const recoveredPattern = result.recurringIssuePatterns[0];
    expect(recoveredPattern.issueKeyword).toBe('DB接続');
    expect(recoveredPattern.occurrenceCount).toBe(3);
    expect(recoveredPattern.priorityScore).toBe(85);
    expect(recoveredPattern.timeSeriesPattern).toBe('週内分散型');

    // メタデータの検証：キャッシュヒットを示すメタデータが含まれることを確認
    expect((result as any).cacheHit).toBe(true);
    expect((result as any).cachedAt).toBeDefined();
    expect(typeof (result as any).cachedAt).toBe('string');

    // 可視化グラフの検証
    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    const graph = result.visualizationGraphs[0];
    expect(graph.graphType).toBe('折れ線');
    expect(graph.title).toBe('DB接続エラー発生頻度の推移');
    expect(Array.isArray(graph.dataPoints)).toBe(true);

    // メール送信の検証
    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailDate = new Date(result.emailSentAt);
    expect(emailDate.getTime()).toBeGreaterThan(0);

    // TextAnalysisServiceAdapterが呼び出された回数を確認：最大3回の再試行
    expect(textAnalysisServiceAdapterStub.classifyIssueSeverity).toHaveBeenCalled();
    // 再試行回数は最大3回であることを確認（1回の初期呼び出し + 3回の再試行 = 4回まで許可）
    const callCount = textAnalysisServiceAdapterStub.classifyIssueSeverity.mock.calls.length;
    expect(callCount).toBeLessThanOrEqual(4);
    expect(callCount).toBeGreaterThanOrEqual(1);

    // キャッシュからの復旧が行われたことを確認
    expect((result as any).recoveryMethod).toBe('cache');
    expect((result as any).retryAttempts).toBeDefined();
    expect((result as any).retryAttempts).toBeGreaterThan(0);
  });
});