import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携までの自動実行', () => {
  test('SCEN-1271: 既存ツール課題データ連携リトライ機能 - 認証トークン欠落時のエラーハンドリング', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを認証トークン欠落状態で構成
    const authTokenMissingAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('401 Unauthorized: Authentication token missing')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/api/v3',
      apiAuthToken: '', // 認証トークン欠落
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      scoreThresholds: {
        high: 70,
        medium: 40,
        low: 0,
      },
    };

    const categoryMappings = [
      {
        systemCategory: 'performance',
        toolCategory: 'Performance',
      },
    ];

    const extractedIssueData = [
      {
        issueId: 'issue-001',
        title: 'パフォーマンス問題',
        description: '昨日: バグ修正、今日: テスト実施、課題: パフォーマンス問題',
        occurrenceCount: 2,
        severity: 'high' as const,
      },
    ];

    const input = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Act: runTx5Imp1Agentを呼び出す
    const result = await runTx5Imp1Agent(input, authTokenMissingAdapter);

    // Assert: エラーハンドリング結果を検証
    expect(result.integrationStatus).toBe('retry_scheduled');
    expect(result.validatedIssues).toEqual([]);
    expect(result.integrationResult.failedCount).toBe(1);
    expect(result.integrationResult.successCount).toBe(0);

    // Assert: 認証エラーが正しく記録されているか確認
    expect(result.integrationResult.retryConfig).toBeDefined();
    expect(result.integrationResult.retryConfig?.maxRetries).toBe(3);
    expect(result.integrationResult.retryConfig?.backoffMultiplier).toBe(2);
    expect(result.integrationResult.retryConfig?.initialDelayMs).toBe(5000);

    // Assert: extractKeywordsメソッドが401エラーで失敗したことを確認
    expect(authTokenMissingAdapter.extractKeywords).toHaveBeenCalled();

    // Assert: エラーメッセージに認証失敗の情報が含まれているか
    expect(result.integrationResult.issues[0]?.validationStatus).toBe('invalid');
    expect(result.integrationResult.issues[0]?.errorMessage).toMatch(/401|Unauthorized|token/i);

    // Assert: 管理ログに認証失敗ログが記録されているか
    expect(result.executionSummary.exceptions.length).toBeGreaterThan(0);
    expect(result.executionSummary.exceptions[0]).toMatch(
      /401|Unauthorized|Authentication/i
    );
  });
});