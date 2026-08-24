import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8AgentInput, Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('ボトルネック変化パターン可視化レポート生成機能 - 発生頻度バリデーション', () => {
  test('SCEN-1991: 発生頻度が負の数値のとき、レポート生成がエラーになる', async () => {
    // テスト対象: runTx8Imp1Agent関数を、発生頻度が負の数値を含むボトルネック変化パターンデータで呼び出す準備
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';
    const teamIds = ['team-001', 'team-002'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const agentInput: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    // フェイクAIクライアント(Tx8Imp1AiClient)を注入
    // ボトルネック変化パターンデータとして{pattern: 'database_delay', frequency: -5, week: '2024-W01'}を含むペイロードを設定
    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: 'issue-001',
            keyword: 'database_delay',
            occurrenceCount: 5,
            firstOccurrence: '2024-01-01T09:00:00Z',
            lastOccurrence: '2024-01-15T14:30:00Z',
            severity: 'high',
          },
        ],
        extractionTimestamp: '2024-01-31T18:00:00Z',
      }),
      executeAction02: jest.fn().mockResolvedValue({
        patterns: [
          {
            pattern: 'database_delay',
            frequency: -5,
            week: '2024-W01',
            trend: 'increasing',
            confidence: 0.85,
          },
        ],
        analysisTimestamp: '2024-01-31T18:05:00Z',
      }),
      executeAction03: jest.fn().mockResolvedValue({
        validationResult: {
          isValid: false,
          errors: [
            {
              code: 'INVALID_FREQUENCY',
              message: '発生頻度は0以上の整数である必要があります',
              value: -5,
              field: 'frequency',
            },
          ],
          validationTimestamp: '2024-01-31T18:06:00Z',
        },
      }),
      executeAction04: jest.fn(),
      executeAction05: jest.fn(),
    };

    // runTx8Imp1Agentのオーケストレーター関数を実行
    const result = await runTx8Imp1Agent(agentInput, mockAiClient);

    // 処理がAction 1（朝会報告管理システムから課題データを検索・抽出）でペイロードを受け取る
    expect(mockAiClient.executeAction01).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      })
    );

    // 受け取ったペイロード内の発生頻度フィールドが負の数値であることを検証
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    expect(mockAiClient.executeAction03).toHaveBeenCalled();

    // バリデーションエラーハンドラが発火し、エラーオブジェクトを生成
    // エラーが適切にcatch句でハンドルされ、スロー（throw）されることなくエラー状態で関数を終了
    expect(result).toEqual({
      success: false,
      error: {
        code: 'INVALID_FREQUENCY',
        message: '発生頻度は0以上の整数である必要があります',
        value: -5,
        field: 'frequency',
      },
      generatedReport: null,
    });

    // レポート生成処理（Action 4, Action 5）は実行されない
    expect(mockAiClient.executeAction04).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction05).not.toHaveBeenCalled();
  });
});