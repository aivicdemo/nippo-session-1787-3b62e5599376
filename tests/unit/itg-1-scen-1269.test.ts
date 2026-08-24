import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 agent: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1269: [error] 既存ツール課題データ連携リトライ機能 - 連携対象の外部ツール識別子が欠落している場合、エラーとなる
  test('should throw error with MISSING_EXTERNAL_TOOL_ID when externalToolId is missing', async () => {
    const extractedIssueData = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection to database is timing out intermittently',
        severity: 'high',
        occurrenceFrequency: 5,
        impactScore: 85,
        externalToolId: null as unknown as string,
      },
    ];

    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/rest/api/3',
      apiToken: 'token-placeholder',
      projectKey: 'PROJ',
    };

    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 75,
      mediumThreshold: 50,
      lowThreshold: 0,
    };

    const categoryMappings = [
      {
        systemCategory: 'quality',
        toolCategory: 'Quality',
      },
      {
        systemCategory: 'delivery',
        toolCategory: 'Schedule',
      },
    ];

    const notificationServiceStub: Partial<{
      sendReminderNotification: jest.Mock;
    }> = {
      sendReminderNotification: jest.fn(),
    };

    const aiClientStub: Tx5Imp1AiClient = {
      callAction01ExtractAndValidate: jest.fn().mockResolvedValue({
        validatedIssues: extractedIssueData.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: issue.impactScore,
          priorityRank: 'high' as const,
          category: 'quality',
          toolIssueId: null,
          validationStatus: 'valid' as const,
        })),
        validationReport: {
          totalCount: 1,
          validCount: 1,
          warningCount: 0,
          invalidCount: 0,
        },
      }),
      callAction02JudgePriority: jest.fn().mockResolvedValue({
        issues: extractedIssueData.map((issue) => ({
          issueId: issue.issueId,
          priorityScore: issue.impactScore,
          priorityRank: 'high' as const,
          category: 'quality',
          toolIssueId: null,
          validationStatus: 'valid' as const,
        })),
      }),
      callAction03MapToExternalTool: jest.fn().mockResolvedValue({
        mappedIssues: extractedIssueData.map((issue) => ({
          issueId: issue.issueId,
          externalToolId: null,
          toolCategory: 'Quality',
        })),
      }),
      callAction04ExecuteIntegration: jest.fn().mockResolvedValue({
        successCount: 0,
        failureCount: 1,
        failureReasons: [
          {
            issueId: 'issue-001',
            reason: 'MISSING_EXTERNAL_TOOL_ID',
            message: '外部ツール識別子が指定されていません',
          },
        ],
        retryScheduled: false,
      }),
      callAction05NotifyCompletion: jest.fn().mockResolvedValue({
        confirmationEmailSent: false,
        notificationStatus: 'failed',
      }),
    };

    const error = await runTx5Imp1Agent(
      {
        extractedIssueData,
        toolIntegrationConfig,
        priorityRules,
        categoryMappings,
      },
      aiClientStub
    ).catch((err) => err);

    expect(error).toBeDefined();
    expect(error.code || error.message).toMatch(/MISSING_EXTERNAL_TOOL_ID/);
    expect(
      error.message || error.description || String(error)
    ).toMatch(/外部ツール識別子が指定されていません/);
    expect(
      notificationServiceStub.sendReminderNotification
    ).not.toHaveBeenCalled();
  });
});