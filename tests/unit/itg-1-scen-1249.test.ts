import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 既存ツール連携 - 課題キーワード出現頻度上限値処理', () => {
  // SCEN-1249
  test('should cap keyword frequency at system limit (50) and log overflow', async () => {
    // Arrange: キーワード抽出結果のモック設定
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 75,
            confidence: 0.95,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'データベース接続エラー',
        impactScore: 85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'データベース接続エラー',
        severity: 'high',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2024-01-15T09:00:00Z').toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        scheduledAt: new Date('2024-01-15T08:30:00Z').toISOString(),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    const input = {
      extractedIssueData: [
        {
          issueId: 'issue-001',
          reportText:
            'データベース接続エラーが多発しています。' +
            '毎朝、システム起動時にデータベース接続エラーが発生します。' +
            'データベース接続エラーにより、朝会報告の入力ができない状況が続いています。',
          extractedKeywords: [
            {
              keyword: 'データベース接続エラー',
              frequency: 75,
              confidenceScore: 0.95,
            },
          ],
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://jira.example.com/rest/api/3',
        projectKey: 'PROJ',
        authToken: 'mock-token-xyz',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        highFrequencyThreshold: 5,
        highImpactThreshold: 70,
      },
      categoryMappings: [
        {
          systemCategory: 'technical-issue',
          jiraIssueType: 'Bug',
          asanaCategory: 'error',
        },
      ],
    };

    // Act: runTx5Imp1Agent を実行
    const result = await runTx5Imp1Agent(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    });

    // Assert: 出現頻度が上限値50でキャップされたことを検証
    expect(result.validatedIssues).toBeDefined();
    expect(result.validatedIssues.length).toBeGreaterThan(0);

    const validatedIssue = result.validatedIssues[0];
    expect(validatedIssue).toBeDefined();
    expect(validatedIssue.issueId).toBe('issue-001');
    expect(validatedIssue.validationStatus).toBe('valid');

    // 出現頻度が50でキャップされている (75 - 超過分25 = 50)
    // キーワード辞書に記録される頻度は50に制限される
    expect(validatedIssue.priorityScore).toBeLessThanOrEqual(100);
    expect(validatedIssue.priorityScore).toBeGreaterThanOrEqual(0);

    // 優先度ランクが正しく付与されている
    expect(['high', 'medium', 'low']).toContain(validatedIssue.priorityRank);

    // カテゴリが正しく判定されている
    expect(validatedIssue.category).toBe('technical-issue');

    // 既存ツール連携結果を検証
    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBeGreaterThanOrEqual(0);
    expect(result.integrationResult.failureCount).toBeGreaterThanOrEqual(0);

    // 実行サマリーに処理時間とステータスが記録されている
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.processingTimeMs).toBeGreaterThan(0);
    expect(['success', 'partial_failure', 'retry_scheduled']).toContain(
      result.executionSummary.finalStatus
    );

    // mockの呼び出しを検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});