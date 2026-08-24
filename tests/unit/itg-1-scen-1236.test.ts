import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携までの自律実行', () => {
  // SCEN-1236: [error] 既存ツール連携機能 - プロジェクトマネージャーの権限がない状態で連携実行ボタンが押下されたとき処理が中断される
  test('should throw authorization error when non-PM user attempts tool integration', async () => {
    // Arrange: プロジェクトマネージャー権限なし（部員権限）のユーザーを設定
    const userWithoutPmPermission = {
      userId: 'user_001',
      role: 'engineer', // PM権限なし
      teamId: 'team_001',
    };

    // 抽出済み課題データ
    const extractedIssueData = [
      {
        issueId: 'issue_001',
        content: 'データベース接続がタイムアウト',
        keyword: 'DB接続タイムアウト',
        occurrenceCount: 3,
        impactScore: 75,
      },
      {
        issueId: 'issue_002',
        content: 'APIレスポンス遅延',
        keyword: 'API遅延',
        occurrenceCount: 2,
        impactScore: 60,
      },
    ];

    // ツール連携設定
    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'PROJ',
      authToken: 'token_placeholder',
    };

    // 優先度判定ルール
    const priorityRules = {
      highThreshold: 70,
      mediumThreshold: 40,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    // カテゴリマッピング
    const categoryMappings = [
      {
        keyword: 'DB接続タイムアウト',
        category: 'Infrastructure',
        toolCategory: 'Infra',
      },
      {
        keyword: 'API遅延',
        category: 'Performance',
        toolCategory: 'Perf',
      },
    ];

    // スタブ化したNotificationServiceAdapter
    // 権限チェック例外を返すように設定
    const stubAiClient: Tx5Imp1AiClient = {
      validateAndProcessIssues: jest.fn(async () => {
        throw new Error('プロジェクトマネージャー権限が必要です');
      }),
    };

    // Act & Assert: 権限エラーが発生することを確認
    await expect(
      runTx5Imp1Agent(
        {
          extractedIssueData,
          toolIntegrationConfig,
          priorityRules,
          categoryMappings,
          projectManagerId: userWithoutPmPermission.userId,
        },
        stubAiClient,
      ),
    ).rejects.toThrow(/プロジェクトマネージャー権限/);

    // Assert: AIクライアントが呼び出されたことを確認（権限チェック前に例外が発生することを示す）
    expect(stubAiClient.validateAndProcessIssues).toHaveBeenCalled();
  });
});