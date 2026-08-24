import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の再発パターン分析機能 - 同一キーワードの出現頻度カウント', () => {
  test('SCEN-1935: 同一キーワード「ネットワーク障害」が3回出現する場合、出現頻度が重複なく正確に3とカウントされること', async () => {
    // 同一キーワード「ネットワーク障害」が3回出現するテストデータ
    const testReportText =
      '昨日ネットワーク障害が発生。今日もネットワーク障害の対応。ネットワーク障害の再発が懸念される';

    // TextAnalysisServiceAdapterのextractKeywordsメソッドをモック化
    const mockAiClient: Tx8Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'ネットワーク障害',
            frequency: 3,
            confidenceScore: 0.95,
          },
          {
            keyword: '対応',
            frequency: 1,
            confidenceScore: 0.75,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
      analyzeTimeSeriesPattern: jest.fn().mockResolvedValue({
        pattern: '増加傾向',
        confidence: 0.88,
      }),
      generateVisualizationGraphs: jest.fn().mockResolvedValue({
        graphs: [
          {
            graphType: '折れ線',
            title: '課題発生数の推移',
            dataPoints: [
              { date: '2024-01-01', count: 1 },
              { date: '2024-01-02', count: 2 },
              { date: '2024-01-03', count: 3 },
            ],
          },
        ],
      }),
    };

    // runTx8Imp1Agentを呼び出し
    const input = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-07T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    // 戻り値のキーワード「ネットワーク障害」のfrequencyを検証
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(result.recurringIssuePatterns.length).toBeGreaterThan(0);

    const networkIssuePattern = result.recurringIssuePatterns.find(
      (pattern) => pattern.issueKeyword === 'ネットワーク障害'
    );

    // 同一キーワードの3回の出現が重複なく正しくカウントされていることを確認
    expect(networkIssuePattern).toBeDefined();
    expect(networkIssuePattern?.occurrenceCount).toBe(3);
    expect(typeof networkIssuePattern?.occurrenceCount).toBe('number');

    // 時系列パターンが正確に記録されていることを確認
    expect(networkIssuePattern?.timeSeriesPattern).toBe('増加傾向');

    // 優先度スコアが正確に記録されていることを確認
    expect(networkIssuePattern?.priorityScore).toBe(85);

    // 生成されたレポートIDが存在することを確認
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // 可視化グラフが生成されていることを確認
    expect(result.visualizationGraphs).toBeDefined();
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    // メール配信日時がISO 8601形式で記録されていることを確認
    expect(result.emailSentAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.emailSentAt)).toBe(
      true
    );

    // extractKeywordsメソッドが正確に1回呼び出されたことを確認
    expect(mockAiClient.extractKeywords).toHaveBeenCalledTimes(1);
  });
});