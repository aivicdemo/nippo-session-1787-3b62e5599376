import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 既存ツール連携機能', () => {
  test('SCEN-1214: extractKeywordsが空配列を返した時点で後続の課題分析処理が呼び出されず、処理が中断される', async () => {
    const extractedIssueData = [
      {
        issueId: 'issue-001',
        content: 'データベース接続エラーが発生した',
        reportedAt: new Date('2024-01-15T09:00:00Z'),
      },
      {
        issueId: 'issue-002',
        content: 'APIレスポンスタイムアウトの問題が続いている',
        reportedAt: new Date('2024-01-15T09:15:00Z'),
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      authToken: 'test-token-12345',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings = [
      {
        systemCategory: 'システムエラー',
        toolCategory: 'Bug',
        priority: 'high' as const,
      },
      {
        systemCategory: 'パフォーマンス',
        toolCategory: 'Performance',
        priority: 'medium' as const,
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const aiClient = {
      callExtractAndValidate: jest.fn(),
      callPrioritizeAndCategorize: jest.fn(),
      callIntegrationExecution: jest.fn(),
    };

    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      aiClient,
      {
        textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
        notificationServiceAdapter: mockNotificationServiceAdapter,
      }
    );

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    expect(result.validatedIssues).toHaveLength(0);
    expect(result.executionSummary.status).toBe('analysis_unavailable');
    expect(result.executionSummary.fallbackMode).toBe('manual_keyword_input');
    expect(result.executionSummary.userMessageKey).toBe('課題分析が一時的に利用できません。手動入力をご利用ください');

    expect(result.integrationResult.status).toBe('deferred');
    expect(result.integrationResult.deferredReason).toBe('no_keywords_extracted');
  });
});