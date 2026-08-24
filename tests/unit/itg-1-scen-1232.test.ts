import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1232: [error] 既存ツール連携機能 - 連携対象のチームIDが空文字のとき処理が中断される
  it('should throw ValidationError when teamId is empty string', async () => {
    // Arrange: スタブ AI Client を準備
    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssues: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: 'issue-001',
            priorityScore: 75,
            priorityRank: 'high',
            category: 'quality',
            toolIssueId: null,
            validationStatus: 'valid',
          },
        ],
        validationMetadata: {
          totalProcessed: 1,
          passedCount: 1,
          failedCount: 0,
          timestamp: '2024-01-15T09:00:00Z',
        },
      }),
      generateIntegrationPayload: jest.fn().mockResolvedValue({
        jiraPayload: {
          project: 'PROJ',
          summary: 'Test Issue',
          description: 'Test Description',
          issuetype: 'Bug',
          priority: 'High',
        },
        asanaPayload: {
          name: 'Test Issue',
          notes: 'Test Description',
          priority: 'high',
          custom_fields: {
            impact_score: 75,
          },
        },
      }),
      executeToolIntegration: jest.fn().mockResolvedValue({
        success: false,
        failedReason: 'teamId is required',
        retryable: false,
        toolType: 'jira',
      }),
      handleIntegrationRetry: jest.fn().mockResolvedValue({
        retryAttempt: 0,
        maxRetries: 3,
        nextRetryTime: null,
        finalStatus: 'failed',
      }),
      generateConfirmationEmail: jest.fn().mockResolvedValue({
        recipientEmail: 'manager@company.com',
        emailSubject: 'Failed: Issue Integration to Jira',
        emailBody: 'Integration failed due to invalid teamId',
      }),
    };

    // 空文字 teamId を持つ入力データ
    const inputWithEmptyTeamId: Tx5Imp1AgentInput = {
      extractedIssueIds: ['issue-001'],
      validationMode: 'auto',
      targetToolType: 'jira',
      projectManagerId: 'pm-001',
    };

    // ツール連携設定に空文字 teamId を挿入
    const toolIntegrationConfig: ToolIntegrationConfig = {
      teamId: '', // 空文字で検証エラートリガー
      apiKey: 'test-api-key',
      baseUrl: 'https://jira.company.com',
      projectKey: 'PROJ',
      defaultAssignee: 'dev-lead@company.com',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        systemCategory: 'quality',
        jiraCategory: 'Bug',
        asanaCategory: 'bug',
      },
      {
        systemCategory: 'performance',
        jiraCategory: 'Task',
        asanaCategory: 'task',
      },
    ];

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        content: 'Database connection timeout',
        frequency: 3,
        impactScore: 85,
      },
    ];

    // Act & Assert: teamId が空文字の場合、ValidationError が発生することを検証
    await expect(
      runTx5Imp1Agent(
        {
          extractedIssueData,
          toolIntegrationConfig,
          priorityRules,
          categoryMappings,
        },
        mockAiClient
      )
    ).rejects.toThrow(/teamId/);
  });
});