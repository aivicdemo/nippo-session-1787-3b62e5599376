import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { ExtractedIssue, ToolIntegrationConfig, PriorityRuleSet, CategoryMapping } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行 - エスカレーション条件検証', () => {
  let notificationServiceAdapterStub: any;
  let aiClientStub: Tx5Imp1AiClient;

  beforeEach(() => {
    notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveryId: 'notif-20240115-001',
        timestamp: new Date('2024-01-15T11:00:00Z').toISOString(),
      }),
    };

    aiClientStub = {
      action01_validateIssueData: jest.fn().mockResolvedValue({
        validationStatus: 'valid',
        checkedCount: 1,
        errorCount: 0,
      }),
      action02_determineIssueProperties: jest.fn().mockResolvedValue({
        issueId: 'issue-001',
        priorityScore: 85,
        priorityRank: 'high',
        categoryList: ['システム障害', 'セキュリティ'],
        multiCategoryFlag: true,
        confidenceScore: 0.75,
      }),
      action03_prepareToolIntegration: jest.fn().mockResolvedValue({
        integrationId: null,
        skippedReason: 'escalation_pending_human_review',
      }),
      action04_executeToolRegistration: jest.fn().mockResolvedValue({
        registrationId: null,
        executed: false,
      }),
      action05_recordCompletionStatus: jest.fn().mockResolvedValue({
        statusId: 'status-escalation-001',
        finalStatus: 'escalation_pending_human_review',
        recordedAt: new Date('2024-01-15T11:00:15Z').toISOString(),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3153
  test('複数カテゴリに該当する課題が検出された場合、既存ツール連携はスキップされ、エスカレーション通知が送信されること', async () => {
    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        description: 'ログイン機能がダウンしており、システムに接続できない状態。パスワード変更機能も利用不可。',
        extractedKeywords: ['システム障害', 'セキュリティ'],
        occurrenceCount: 2,
        affectedTeamCount: 3,
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'PROJ',
      authenticationType: 'oauth2',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.3,
      impactWeight: 0.5,
      riskWeight: 0.2,
      highThreshold: 75,
      mediumThreshold: 50,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'システム障害',
        toolCategory: 'Infrastructure',
      },
      {
        systemCategory: 'セキュリティ',
        toolCategory: 'Security',
      },
    ];

    const result = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      aiClientStub,
      notificationServiceAdapterStub
    );

    expect(aiClientStub.action01_validateIssueData).toHaveBeenCalledTimes(1);
    expect(aiClientStub.action01_validateIssueData).toHaveBeenCalledWith(
      expect.objectContaining({
        issues: extractedIssueData,
      })
    );

    expect(aiClientStub.action02_determineIssueProperties).toHaveBeenCalledTimes(1);
    expect(aiClientStub.action02_determineIssueProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        issueId: 'issue-001',
        rules: priorityRules,
        mappings: categoryMappings,
      })
    );

    expect(result.validatedIssues).toHaveLength(1);
    expect(result.validatedIssues[0]).toMatchObject({
      issueId: 'issue-001',
      priorityScore: 85,
      priorityRank: 'high',
      category: expect.any(String),
      validationStatus: 'valid',
    });

    expect(result.validatedIssues[0].validationStatus).toBe('valid');

    expect(aiClientStub.action03_prepareToolIntegration).toHaveBeenCalledTimes(1);
    expect(aiClientStub.action04_executeToolRegistration).toHaveBeenCalledTimes(0);

    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        issueId: 'issue-001',
        multiCategoryFlag: true,
        categoryList: ['システム障害', 'セキュリティ'],
        confidenceScore: 0.75,
        escalationReason: 'multiple_category_match',
      })
    );

    expect(aiClientStub.action05_recordCompletionStatus).toHaveBeenCalledTimes(1);
    expect(aiClientStub.action05_recordCompletionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        finalStatus: 'escalation_pending_human_review',
        issueId: 'issue-001',
      })
    );

    expect(result.integrationResult).toMatchObject({
      successCount: 0,
      failureCount: 0,
      escalationCount: 1,
      toolIssueIds: [],
    });

    expect(result.executionSummary).toMatchObject({
      totalProcessed: 1,
      escalationDetected: true,
      humanReviewRequired: true,
      finalStatus: 'escalation_pending_human_review',
    });
  });
});