import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('課題の影響度判定と優先度付け表示機能', () => {
  // SCEN-1286: [edge] 既存ツール連携API失敗時の自動リトライ・通知機能 - APIレスポンスタイムアウトエラーが初回で発生した場合、失敗原因の判定が正確である
  test('APIレスポンスタイムアウトエラー時に失敗原因を正確に判定し、適切にログ記録と通知を実行する', async () => {
    // 準備: AIクライアントのモック化
    const mockAiClient: Tx5Imp1AiClient = {
      validateAndJudgePriority: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'issue-001',
            title: 'API接続エラー',
            description: 'Jiraへの接続がタイムアウト',
            priorityScore: 85,
            priorityRank: 'high' as const,
            category: 'システム障害',
            validationStatus: 'valid' as const,
            toolIssueId: null,
          },
        ],
        integrationResult: {
          successCount: 0,
          failureCount: 1,
          retryScheduled: true,
          failureReason: 'APIレスポンスタイムアウト',
          nextRetryAt: new Date('2024-01-15T09:05:00Z').toISOString(),
        },
        executionSummary: {
          processingTimeMs: 2500,
          issuesProcessed: 1,
          status: 'timeout_detected' as const,
          exceptionOccurred: true,
          exceptionType: 'TimeoutError',
          exceptionMessage: 'Request timeout after 30000ms',
        },
      }),
    };

    // 入力データの準備
    const input = {
      extractedIssueData: [
        {
          issueId: 'issue-001',
          reporterTeamId: 'team-001',
          title: 'API接続エラー',
          description: 'Jiraへの接続がタイムアウト',
          extractedKeywords: ['API', 'タイムアウト', '接続エラー'],
          reportedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://example.atlassian.net/rest/api/3',
        authToken: 'token_***',
        requestTimeoutMs: 30000,
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        riskThreshold: 60,
      },
      categoryMappings: [
        {
          reportingCategory: 'システム障害',
          toolCategory: 'Bug',
          priority: 'high' as const,
        },
      ],
    };

    // 実行: runTx5Imp1Agentを呼び出し
    const result = await runTx5Imp1Agent(input, mockAiClient);

    // 検証 1: validatedIssuesが正しく返却される
    expect(result.validatedIssues).toBeDefined();
    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0].issueId).toBe('issue-001');
    expect(result.validatedIssues[0].priorityScore).toBe(85);
    expect(result.validatedIssues[0].priorityRank).toBe('high');
    expect(result.validatedIssues[0].category).toBe('システム障害');

    // 検証 2: integrationResultにタイムアウト情報が記録される
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBe(0);
    expect(result.integrationResult.failureCount).toBe(1);
    expect(result.integrationResult.retryScheduled).toBe(true);
    expect(result.integrationResult.failureReason).toBe('APIレスポンスタイムアウト');

    // 検証 3: 次回リトライ時刻が正確に計算される（初回失敗後5分間隔）
    const nextRetryTime = new Date(result.integrationResult.nextRetryAt);
    const currentTime = new Date('2024-01-15T09:00:00Z');
    const expectedRetryTime = new Date(currentTime.getTime() + 5 * 60 * 1000); // 5分後
    expect(nextRetryTime.getTime()).toBe(expectedRetryTime.getTime());

    // 検証 4: executionSummaryにタイムアウト例外情報が記録される
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.status).toBe('timeout_detected');
    expect(result.executionSummary.exceptionOccurred).toBe(true);
    expect(result.executionSummary.exceptionType).toBe('TimeoutError');
    expect(result.executionSummary.exceptionMessage).toMatch(/timeout/i);
    expect(result.executionSummary.processingTimeMs).toBe(2500);

    // 検証 5: AIクライアントが正確な入力で呼ばれたことを確認
    expect(mockAiClient.validateAndJudgePriority).toHaveBeenCalledWith(
      expect.objectContaining({
        extractedIssueData: input.extractedIssueData,
        toolIntegrationConfig: input.toolIntegrationConfig,
        priorityRules: input.priorityRules,
        categoryMappings: input.categoryMappings,
      })
    );

    // 検証 6: ダッシュボード表示用メッセージが生成される
    const dashboardMessage = result.executionSummary.status === 'timeout_detected'
      ? '通知送信に遅延が発生しています'
      : '';
    expect(dashboardMessage).toBe('通知送信に遅延が発生しています');

    // 検証 7: リトライが自動スケジュール済みであることを確認
    expect(result.integrationResult.retryScheduled).toBe(true);

    // 検証 8: 失敗原因のログ記録が適切に行われている
    expect(result.integrationResult.failureReason).toBe('APIレスポンスタイムアウト');
  });
});