import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX-8 Imp-1: 課題検索から可視化レポート作成までの自動実行 - AI出力の信頼度検証とエスカレーション', () => {
  test('SCEN-3209: 低確信度(0.35)のAI出力を拒否して安全にエスカレーション引き継ぎを実行', async () => {
    // Arrange: フェイクAIクライアントを構築
    // Action 1で信頼度0.35（基準0.7未満）の曖昧な出力を返すようにモック
    const fakeAiClient: Tx8Imp1AiClient = {
      action01_extractIssueData: jest.fn().mockResolvedValue({
        issueKeywords: ['バグ', 'デリバリ遅延', '品質問題'],
        occurrenceFrequencies: [5, 3, 2],
        confidenceScore: 0.35,
        extractionTimestamp: '2024-12-15T14:00:00Z',
        dataQualityWarnings: [
          'ambiguous_categorization',
          'incomplete_temporal_data'
        ]
      }),
      action02_analyzeTimeSeries: jest.fn(),
      action03_detectBottleneckPatterns: jest.fn(),
      action04_selectVisualizationGraphs: jest.fn(),
      action05_generateVisualizationReport: jest.fn()
    };

    // 前回キャッシュされた有効な分析結果を用意
    const previousValidResult = {
      reportId: 'report-valid-2024-12-14',
      recurringIssuePatterns: [
        {
          issueKeyword: 'バグ',
          occurrenceCount: 12,
          timeSeriesPattern: '増加傾向',
          priorityScore: 92
        }
      ],
      visualizationGraphs: [
        {
          graphType: '折れ線',
          title: '課題発生頻度の推移',
          dataPoints: [
            { date: '2024-12-08', count: 2 },
            { date: '2024-12-09', count: 4 }
          ]
        }
      ],
      emailSentAt: '2024-12-14T15:30:00Z'
    };

    // エージェント実行時の入力
    const input = {
      analysisStartDate: '2024-11-15',
      analysisEndDate: '2024-12-15',
      teamIds: ['team-001', 'team-002'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'mgr-001'
    };

    // Act: runTx8Imp1Agentを実行
    const result = await runTx8Imp1Agent(input, fakeAiClient, {
      previousValidResult: previousValidResult,
      confidenceThreshold: 0.7,
      auditLogger: {
        log: jest.fn()
      }
    });

    // Assert: エスカレーション状態を検証
    expect(result).toHaveProperty('status', 'ESCALATED_AWAITING_HUMAN_REVIEW');
    expect(result).toHaveProperty('escalationReason', 'ambiguous_ai_output');
    expect(result).toHaveProperty('confidenceScore', 0.35);
    expect(result).toHaveProperty('requiredAction', 'human_validation_mandatory');
    expect(result).toHaveProperty('previousValidResult', previousValidResult);

    // 監査ログに記録されたことを検証
    const auditLoggerMock = result.auditLogger as jest.Mock;
    const auditLogCalls = auditLoggerMock.mock.calls;
    expect(auditLogCalls.length).toBeGreaterThan(0);
    
    const escalationLogEntry = auditLogCalls.find((call: any[]) =>
      typeof call[0] === 'string' &&
      call[0].includes('ESCALATION') &&
      call[0].includes('Low-confidence AI output detected') &&
      call[0].includes('Action 1') &&
      call[0].includes('confidence_score=0.35') &&
      call[0].includes('threshold=0.7')
    );
    expect(escalationLogEntry).toBeDefined();

    // Action 1は呼び出されたが、Action 2～5は呼び出されないことを確認
    expect(fakeAiClient.action01_extractIssueData).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.action02_analyzeTimeSeries).not.toHaveBeenCalled();
    expect(fakeAiClient.action03_detectBottleneckPatterns).not.toHaveBeenCalled();
    expect(fakeAiClient.action04_selectVisualizationGraphs).not.toHaveBeenCalled();
    expect(fakeAiClient.action05_generateVisualizationReport).not.toHaveBeenCalled();

    // 戻り値に適切なエラーメッセージが含まれることを確認
    expect(result).toHaveProperty('errorMessage');
    expect(result.errorMessage).toMatch(/信頼度|confidence|ambiguous/i);

    // 可視化レポート提示は保留され、前回有効な結果が代替表示されることを確認
    expect(result.reportId).not.toBeDefined();
    expect(result.recurringIssuePatterns).not.toBeDefined();
    expect(result.visualizationGraphs).not.toBeDefined();
    expect(result.previousValidResult.reportId).toBe('report-valid-2024-12-14');
  });
});