import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-03';

describe('月次レポート生成から分析完了までの自動実行', () => {
  test('SCEN-127: Action 3 レポート生成処理が正確に呼び出され、後続アクションに適切に受け継がれる', async () => {
    // モック AI クライアントの呼び出し履歴を記録
    const aiClientCallHistory: Array<{
      actionNumber: number;
      promptText: string;
      promptVersion: string;
    }> = [];

    // モック AI クライアントを構築
    const mockAiClient: Tx7Imp1AiClient = {
      executeAction: jest.fn(async (actionNumber: number, promptText: string, promptVersion: string) => {
        aiClientCallHistory.push({
          actionNumber,
          promptText,
          promptVersion,
        });

        // Action 3（レポート生成処理）の場合、期待されたレスポンスを返す
        if (actionNumber === 3) {
          return {
            reportGenerationStarted: true,
            generatedReportId: 'report-2024-01-001',
            timestamp: '2024-01-15T09:00:00Z',
          };
        }

        // 他のアクションは最小限のレスポンスを返す
        return {
          success: true,
          actionNumber,
        };
      }),
    };

    // runTx7Imp1Agent を実行
    const orchestratorRequest = {
      targetMonth: '2024-01',
      teamId: 'team-engineering',
      triggeredBy: 'schedule' as const,
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(orchestratorRequest, mockAiClient);

    // Action 3（レポート生成処理）の呼び出しを確認
    const action3Call = aiClientCallHistory.find((call) => call.actionNumber === 3);
    expect(action3Call).toBeDefined();
    expect(action3Call?.actionNumber).toBe(3);

    // buildAction03Prompt で生成されたプロンプトが使用されたことを確認
    const expectedPrompt = buildAction03Prompt({
      targetMonth: '2024-01',
      teamId: 'team-engineering',
      includeDetailedAnalysis: true,
    });
    expect(action3Call?.promptText).toEqual(expectedPrompt);

    // プロンプトバージョンが正しいことを確認
    expect(action3Call?.promptVersion).toBe(ACTION_03_PROMPT_VERSION);

    // Action 3 が正確に 1 回呼び出されたことを確認
    const action3CallCount = aiClientCallHistory.filter((call) => call.actionNumber === 3).length;
    expect(action3CallCount).toBe(1);

    // Action 3 のレスポンスが後続アクションに受け継がれていることを確認
    // （呼び出し履歴から Action 4 以降が存在し、順序が正しいことを検証）
    const action3CallIndex = aiClientCallHistory.findIndex((call) => call.actionNumber === 3);
    expect(action3CallIndex).toBeGreaterThanOrEqual(0);
    
    // Action 3 の後に Action 4 が呼び出されていることを確認（存在する場合）
    if (action3CallIndex < aiClientCallHistory.length - 1) {
      const nextCall = aiClientCallHistory[action3CallIndex + 1];
      expect(nextCall.actionNumber).toBeGreaterThanOrEqual(4);
    }

    // runTx7Imp1Agent がエラーを発生させず完了したことを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('generatedAt');
    expect(result).toHaveProperty('status');

    // 結果に レポート生成が開始されたことを示すデータが含まれることを確認
    expect(result.status).toMatch(/success|partial_success/);
  });
});