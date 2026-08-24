import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成エージェント', () => {
  // SCEN-1836
  test('第1回目の再試行が失敗した場合、第2回目の再試行が10秒の待機後に実行される', async () => {
    // テスト環境初期化
    const mockReportId = 'report-monthly-2024-01-001';
    const mockTargetMonth = '2024-01';
    const mockManagerUserId = 'manager-u001';
    const mockTriggerTime = new Date('2024-02-01T09:00:00Z');

    // TextAnalysisServiceAdapterスタブ化
    // 第1回目呼び出し: タイムアウトエラーで失敗
    // 第2回目呼び出し: 成功
    let extractKeywordsCallCount = 0;
    const mockTextAnalysisServiceAdapter: Tx7Imp1AiClient = {
      extractKeywords: jest.fn(async () => {
        extractKeywordsCallCount += 1;
        if (extractKeywordsCallCount === 1) {
          // 第1回目: タイムアウトエラー
          throw new Error('API request timeout');
        }
        // 第2回目: 成功
        return {
          keywords: [
            { keyword: 'ビルドエラー', frequency: 5 },
            { keyword: 'テスト失敗', frequency: 3 },
            { keyword: 'デプロイ遅延', frequency: 2 }
          ]
        };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => ({
        keyword,
        impactScore: 75
      })),
      classifyIssueSeverity: jest.fn(async (issueText: string) => 'high')
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: mockTriggerTime,
      targetMonth: mockTargetMonth,
      managerUserId: mockManagerUserId,
      includeDetailedAnalysis: true
    };

    // 時間計測開始
    const firstCallTime = Date.now();
    let secondCallTime: number | null = null;

    // モック化した呼び出し時刻キャプチャ
    mockTextAnalysisServiceAdapter.extractKeywords = jest.fn(async () => {
      if (extractKeywordsCallCount === 1) {
        throw new Error('API request timeout');
      }
      secondCallTime = Date.now();
      return {
        keywords: [
          { keyword: 'ビルドエラー', frequency: 5 },
          { keyword: 'テスト失敗', frequency: 3 },
          { keyword: 'デプロイ遅延', frequency: 2 }
        ]
      };
    });

    // 月次課題傾向分析レポート生成処理を実行
    const result = await runTx7Imp1Agent(agentInput, mockTextAnalysisServiceAdapter);

    // 第1回目のAPI呼び出し失敗を確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(2);

    // 第2回目のAPI呼び出しが10秒後に実行されることを確認
    expect(secondCallTime).not.toBeNull();
    const elapsedTime = (secondCallTime as number) - firstCallTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(10000);
    expect(elapsedTime).toBeLessThan(11000);

    // 第2回目のAPI呼び出しが成功し、レポートが生成されたことを確認
    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBeTruthy();
    expect(result.analysisResultSummary).toBeDefined();
    expect(result.analysisResultSummary.topPriorityChallenges).toBeDefined();
    expect(Array.isArray(result.analysisResultSummary.topPriorityChallenges)).toBe(true);
    expect(result.deliveryTimestamp).toBeInstanceOf(Date);
  });
});