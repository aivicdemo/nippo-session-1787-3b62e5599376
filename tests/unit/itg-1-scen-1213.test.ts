import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX-5-IMP-1: 課題抽出から既存ツール連携までの自律実行', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
      validateAndClassify: jest.fn(),
      integrateWithExternalTool: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1213
  test('should handle null extraction result and fallback to manual input mode', async () => {
    const extractedIssueData = [
      {
        issueId: 'issue_001',
        content: '昨日やったこと: APIの実装が完了しました。',
        reportDate: '2024-01-15',
      },
      {
        issueId: 'issue_002',
        content: '今日やること: テストコード作成予定。',
        reportDate: '2024-01-15',
      },
      {
        issueId: 'issue_003',
        content: '抱えている課題: データベース接続がタイムアウトする問題が発生。',
        reportDate: '2024-01-15',
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/api/v3',
      apiKey: 'test_api_key_placeholder',
      projectKey: 'TEST',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings = [
      {
        extractedKeyword: 'データベース接続',
        targetCategory: 'Backend',
        toolCategoryId: 'CAT_001',
      },
      {
        extractedKeyword: 'テストコード',
        targetCategory: 'QA',
        toolCategoryId: 'CAT_002',
      },
    ];

    mockAiClient.extractKeywords.mockResolvedValue(null);

    const input = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(mockAiClient.extractKeywords).toHaveBeenCalledWith(extractedIssueData);
    expect(mockAiClient.assessImpactScore).not.toHaveBeenCalled();
    expect(mockAiClient.classifyIssueSeverity).not.toHaveBeenCalled();
    expect(mockAiClient.integrateWithExternalTool).not.toHaveBeenCalled();

    expect(result).toEqual({
      validatedIssues: [],
      integrationResult: {
        success: false,
        failureReason: 'EXTRACTION_FAILED',
        failureDetails:
          '課題分析が一時的に利用できません。手動入力をご利用ください',
        processedCount: 0,
        failedCount: 0,
        retryCount: 0,
      },
      executionSummary: {
        status: 'extraction_failed',
        processingTimeMs: expect.any(Number),
        errorMessage:
          '課題分析が一時的に利用できません。手動入力をご利用ください',
        manualInputMode: true,
        reportProcessingContinued: true,
      },
    });

    expect(result.executionSummary.manualInputMode).toBe(true);
    expect(result.executionSummary.reportProcessingContinued).toBe(true);
  });
});