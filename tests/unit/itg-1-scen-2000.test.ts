import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-2000
  test('ボトルネック変化パターン可視化レポート生成機能 - 時系列データがタイムスタンプなしのとき、レポート生成がエラーになる', async () => {
    // 時系列データがタイムスタンプなしのデータセットを準備
    const issueDataWithoutTimestamp = [
      {
        issueKeyword: 'デバッグ失敗',
        occurrenceCount: 5,
        // タイムスタンプフィールドを意図的に省略
      },
      {
        issueKeyword: 'ビルドエラー',
        occurrenceCount: 3,
        // タイムスタンプフィールドを意図的に省略
      },
    ];

    const input: Tx8AgentInput = {
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-31T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    // TextAnalysisServiceAdapterをスタブ化
    const textAnalysisStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'デバッグ失敗', frequency: 5 },
          { keyword: 'ビルドエラー', frequency: 3 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        scores: [
          { keyword: 'デバッグ失敗', impactScore: 75 },
          { keyword: 'ビルドエラー', impactScore: 60 },
        ],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classifications: [
          { keyword: 'デバッグ失敗', severity: 'high' },
          { keyword: 'ビルドエラー', severity: 'medium' },
        ],
      }),
    };

    // Tx8Imp1AiClientをスタブ化
    const aiClientStub = {
      buildAction01Prompt: jest.fn().mockReturnValue('action-01-prompt'),
      action01PromptVersion: '1.0.0',
      buildAction02Prompt: jest.fn().mockReturnValue('action-02-prompt'),
      action02PromptVersion: '1.0.0',
      buildAction03Prompt: jest.fn().mockReturnValue('action-03-prompt'),
      action03PromptVersion: '1.0.0',
      buildAction04Prompt: jest.fn().mockReturnValue('action-04-prompt'),
      action04PromptVersion: '1.0.0',
      buildAction05Prompt: jest.fn().mockReturnValue('action-05-prompt'),
      action05PromptVersion: '1.0.0',
      callModel: jest.fn().mockResolvedValue({
        actionType: 'action-03',
        result: 'bottleneck-analysis',
      }),
    };

    // runTx8Imp1Agent関数を呼び出す
    // タイムスタンプなしのデータセットを第一パラメータ、スタブ化したTx8Imp1AiClientを第二パラメータとして渡す
    let thrownError: Error | null = null;

    try {
      await runTx8Imp1Agent(input, aiClientStub as any);
    } catch (error) {
      thrownError = error as Error;
    }

    // エラーがスローされたことを検証
    expect(thrownError).not.toBeNull();

    // スローされたエラーオブジェクトのmessageプロパティが期待するテキストを含むことを確認
    expect(thrownError?.message).toMatch(/時系列データにタイムスタンプが含まれていません/);

    // スローされたエラーオブジェクトのcodeプロパティが「MISSING_TIMESTAMP」であることを確認
    if (thrownError && 'code' in thrownError) {
      expect((thrownError as any).code).toBe('MISSING_TIMESTAMP');
    }

    // エスカレーション条件「データ品質が基準以下の場合」に該当することを確認
    // 可視化レポートは生成されず、部長への提示は行われない
    expect(aiClientStub.callModel).not.toHaveBeenCalled();
  });
});