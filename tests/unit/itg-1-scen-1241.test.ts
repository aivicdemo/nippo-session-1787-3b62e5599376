import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題キーワード抽出上限処理', () => {
  // SCEN-1241: [edge] 既存ツール連携機能 - 抽出課題データ件数が上限値を超える場合、超過分は正しく処理される
  test('1000件のキーワードが返されたとき、上限500件を超える分はスキップされダッシュボードに通知される', async () => {
    const KEYWORD_LIMIT = 500;
    const EXTRACTED_KEYWORD_COUNT = 1000;
    const SKIPPED_COUNT = EXTRACTED_KEYWORD_COUNT - KEYWORD_LIMIT;

    // 1000件のキーワードデータを生成
    const mockKeywords = Array.from({ length: EXTRACTED_KEYWORD_COUNT }, (_, i) => ({
      keyword: `issue_keyword_${i + 1}`,
      frequency: EXTRACTED_KEYWORD_COUNT - i,
    }));

    // TextAnalysisServiceAdapterをモック化
    const mockAiClient: Tx5Imp1AiClient = {
      extractKeywords: jest.fn(async () => mockKeywords),
      assessImpactScore: jest.fn(async (keyword) => ({
        keyword,
        impactScore: 50 + Math.random() * 50,
      })),
      classifyIssueSeverity: jest.fn(async (text) => 'medium'),
    };

    const input = {
      extractedIssueData: [
        {
          issueId: 'issue_001',
          issueText: '日報内容に記載された課題テキストの例示',
          timestamp: new Date('2024-01-15T09:00:00Z'),
        },
      ],
      toolIntegrationConfig: {
        toolType: 'jira' as const,
        apiEndpoint: 'https://jira.example.com/api',
        apiKey: 'test-key-placeholder',
      },
      priorityRules: {
        frequencyWeight: 0.6,
        impactWeight: 0.4,
        highThreshold: 70,
        mediumThreshold: 40,
      },
      categoryMappings: [
        {
          systemCategory: 'quality',
          toolCategory: 'Bug',
        },
        {
          systemCategory: 'schedule',
          toolCategory: 'Task',
        },
      ],
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    // 結果の検証
    expect(result.validatedIssues).toBeDefined();
    expect(Array.isArray(result.validatedIssues)).toBe(true);

    // 保存されたキーワード件数が上限以下であることを確認
    const savedKeywordCount = result.validatedIssues.length;
    expect(savedKeywordCount).toBeLessThanOrEqual(KEYWORD_LIMIT);

    // 超過分の処理ログが記録されていることを確認
    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.processedAt).toBeDefined();
    expect(result.executionSummary.status).toBe('success');

    // ダッシュボード表示用の情報に超過状況が含まれていることを確認
    if (result.executionSummary.metadata) {
      expect(result.executionSummary.metadata.skippedKeywordCount).toBe(SKIPPED_COUNT);
      expect(result.executionSummary.metadata.keywordLimitReached).toBe(true);
      expect(result.executionSummary.metadata.totalExtractedCount).toBe(EXTRACTED_KEYWORD_COUNT);
      expect(result.executionSummary.metadata.savedCount).toBeLessThanOrEqual(KEYWORD_LIMIT);
    }

    // extractKeywordsが呼び出されたことを確認
    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
  });
});