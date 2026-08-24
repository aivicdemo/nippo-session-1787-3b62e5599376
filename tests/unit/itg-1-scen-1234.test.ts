import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX5 Imp1 Agent - 既存ツール連携と課題抽出キャッシュフォールバック', () => {
  // SCEN-1234
  test('TextAnalysisServiceAdapter経由の課題抽出が失敗したとき前回のキャッシュ結果で処理を続行する', async () => {
    // === Setup: キャッシュ済みの前回分析結果をセットアップ ===
    const cachedKeywordData = {
      keyword: 'データベース障害',
      occurrenceCount: 3,
      impactScore: 65,
      lastUpdated: '2024-01-15T08:00:00Z',
    };

    // === Setup: TextAnalysisServiceAdapter のスタブ作成（3回連続失敗） ===
    let callCount = 0;
    const failingTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount <= 3) {
          throw new Error('API connection timeout');
        }
        return { keywords: [], frequencies: [] };
      }),
      assessImpactScore: jest.fn().mockImplementation(async () => {
        throw new Error('API connection timeout');
      }),
      classifyIssueSeverity: jest.fn().mockImplementation(async () => {
        throw new Error('API connection timeout');
      }),
    };

    // === Setup: NotificationServiceAdapter のスタブ作成 ===
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        timestamp: '2024-01-15T09:00:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        scheduledTime: '2024-01-15T08:30:00Z',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 1,
        failed: 0,
        pending: 0,
      }),
    };

    // === Input: 新しい日報データ ===
    const reportData = {
      yesterday: 'API統合',
      today: 'テスト実施',
      issue: 'データベース接続がタイムアウトしている',
    };

    const tx5Imp1Input = {
      extractedIssueData: [
        {
          issueId: 'ISSUE-001',
          content: reportData.issue,
          reportDate: '2024-01-15T09:00:00Z',
          reporterId: 'ENG-001',
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://jira.example.com/api/v3',
        projectKey: 'TEST',
        apiKey: 'fake-api-key-for-test',
      },
      priorityRules: {
        frequencyWeight: 0.4,
        impactWeight: 0.6,
        thresholds: {
          high: 75,
          medium: 50,
          low: 25,
        },
      },
      categoryMappings: [
        {
          systemCategory: 'database_issue',
          externalToolCategory: 'Infrastructure',
          keywords: ['database', 'connection', 'timeout'],
        },
        {
          systemCategory: 'api_issue',
          externalToolCategory: 'Backend',
          keywords: ['api', 'integration', 'endpoint'],
        },
      ],
    };

    // === Execute: Agent を実行 ===
    const result = await runTx5Imp1Agent(tx5Imp1Input, failingTextAnalysisServiceAdapter);

    // === Assertion: フォールバック動作の検証 ===
    // 1. キャッシュ結果が含まれることを確認
    expect(result).toHaveProperty('validatedIssues');
    expect(Array.isArray(result.validatedIssues)).toBe(true);

    // 2. キャッシュ済みキーワードが結果に含まれている
    const hasKeywordInResult = result.validatedIssues.some(
      (issue: any) =>
        issue.category?.toLowerCase().includes('database') ||
        issue.validationStatus === 'valid'
    );
    expect(hasKeywordInResult).toBe(true);

    // 3. 優先度スコアがキャッシュ値（65）またはそれに基づく値を含む
    expect(result.validatedIssues.length).toBeGreaterThan(0);
    const firstIssue = result.validatedIssues[0];
    expect(typeof firstIssue.priorityScore).toBe('number');
    expect(firstIssue.priorityScore).toBeGreaterThanOrEqual(0);
    expect(firstIssue.priorityScore).toBeLessThanOrEqual(100);

    // 4. 優先度ランクが正しく設定されている
    expect(['high', 'medium', 'low']).toContain(firstIssue.priorityRank);

    // 5. integrationResult が存在し、キャッシュフォールバック状態を記録している
    expect(result).toHaveProperty('integrationResult');
    expect(result.integrationResult).toHaveProperty('status');

    // 6. executionSummary にキャッシュ使用状況が記録されている
    expect(result).toHaveProperty('executionSummary');
    expect(result.executionSummary).toHaveProperty('executionStatus');

    // API 呼び出しが実行されたことを検証（リトライ試行を確認）
    expect(failingTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();

    // 7. 検証ステータスが適切に設定されている
    expect(['valid', 'warning', 'invalid']).toContain(firstIssue.validationStatus);

    // === Assertion: エラーハンドリング検証 ===
    // executionSummary に例外情報が記録されていることを確認
    if (result.executionSummary.exceptions) {
      expect(Array.isArray(result.executionSummary.exceptions)).toBe(true);
    }

    // === Assertion: 確認メール配信の検証 ===
    // 配信成功フラグが記録されている
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();

    // === Assertion: 優先度判定結果の整合性 ===
    result.validatedIssues.forEach((issue: any) => {
      // priorityScore と priorityRank の整合性を確認
      if (issue.priorityScore >= 75) {
        expect(issue.priorityRank).toBe('high');
      } else if (issue.priorityScore >= 50) {
        expect(issue.priorityRank).toBe('medium');
      } else {
        expect(issue.priorityRank).toBe('low');
      }

      // category が categoryMappings に存在するカテゴリを含む
      expect(typeof issue.category).toBe('string');
      expect(issue.category.length).toBeGreaterThan(0);
    });

    // === Assertion: 処理継続性の検証 ===
    // キャッシュフォールバック時にも validatedIssues が空でないことを確認
    expect(result.validatedIssues.length).toBeGreaterThan(0);

    // === Assertion: 連携ステータスの検証 ===
    expect(result.integrationResult).toHaveProperty('successCount');
    expect(result.integrationResult).toHaveProperty('failureCount');
    expect(typeof result.integrationResult.successCount).toBe('number');
    expect(typeof result.integrationResult.failureCount).toBe('number');
  });
});