import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type TextAnalysisServiceAdapter } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('朝会報告管理システム - 月次課題傾向分析レポート生成', () => {
  // SCEN-1858
  test('分析ロジック失敗時に再試行ロジックへのフラグが false に設定されているときエラーになる', async () => {
    // 準備: TextAnalysisServiceAdapterのスタブを作成
    const analysisError = new Error('API呼び出し失敗: 接続タイムアウト');
    
    const stubTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['パフォーマンス低下', 'ネットワーク遅延'],
        frequencies: [3, 2]
      }),
      assessImpactScore: jest.fn().mockRejectedValue(analysisError),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high'
      })
    };

    // 月次課題傾向分析レポート生成の入力を準備
    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2023-12',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true
    };

    // 月次課題傾向分析レポート生成処理の設定で再試行ロジックフラグをfalseに設定
    const agentConfig = {
      enableRetry: false,
      retryIntervals: [3000, 10000, 30000],
      maxRetries: 3
    };

    // 過去30日分の課題キーワード抽出データを事前に準備（5件以上）
    const mockChallengeData = [
      {
        challengeId: 'ch-001',
        keyword: 'パフォーマンス低下',
        occurrenceFrequency: 3,
        reportDate: '2023-12-01'
      },
      {
        challengeId: 'ch-002',
        keyword: 'ネットワーク遅延',
        occurrenceFrequency: 2,
        reportDate: '2023-12-02'
      },
      {
        challengeId: 'ch-003',
        keyword: 'メモリリーク',
        occurrenceFrequency: 4,
        reportDate: '2023-12-05'
      },
      {
        challengeId: 'ch-004',
        keyword: 'デッドロック',
        occurrenceFrequency: 1,
        reportDate: '2023-12-10'
      },
      {
        challengeId: 'ch-005',
        keyword: 'キャッシュ不整合',
        occurrenceFrequency: 2,
        reportDate: '2023-12-15'
      }
    ];

    // 月次課題傾向分析レポート生成処理を実行
    const result: Tx7Imp1AgentOutput = await runTx7Imp1Agent(
      agentInput,
      stubTextAnalysisServiceAdapter,
      agentConfig,
      mockChallengeData
    );

    // 検証: TextAnalysisServiceAdapterのassessImpactScore呼び出しが1回だけ実行されたことを確認
    expect(stubTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(1);

    // 検証: 再試行が実行されていないことを確認（呼び出し回数が1回のまま）
    const callCount = (stubTextAnalysisServiceAdapter.assessImpactScore as jest.Mock).mock.calls.length;
    expect(callCount).toBe(1);

    // 検証: 生成処理の戻り値がエラー状態であることを確認
    expect(result.executionStatus).toBe('failure');

    // 検証: システムログにエラーメッセージが記録されていることを確認
    expect(result.executionStatus).not.toBe('success');
    expect(result.analysisResultSummary).toBeUndefined();

    // 検証: enableRetry=falseの場合、再試行の間隔（3秒・10秒・30秒）が実行されていないことを確認
    // 再試行ロジックがスキップされたため、タイムスタンプの差分から再試行が行われていないことを確認可能
    expect(result.deliveryTimestamp.getTime() - agentInput.triggerTimestamp.getTime()).toBeLessThan(5000);
  });
});