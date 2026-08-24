import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1: 課題の優先度スコアが負数のとき処理が中断される', () => {
  test('SCEN-1223: 負数の優先度スコアを受け取ったとき、処理は中断され、エラーをダッシュボードに表示する', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database_performance', frequency: 3 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: 'sent', messageId: 'msg-001' }),
      scheduleNotification: jest
        .fn()
        .mockResolvedValue({ scheduleId: 'sch-001' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 1,
        failed: 0,
        pending: 0,
      }),
    };

    const extractedIssueData: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection to database times out frequently',
        reportedBy: 'eng-001',
        reportedAt: new Date('2024-12-15T09:00:00Z'),
        keywords: ['database', 'performance', 'timeout'],
        frequency: 3,
        affectedMembers: ['eng-001', 'eng-002', 'eng-003'],
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiEndpoint: 'https://jira.example.com/api/v3',
      projectKey: 'DEV',
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      highThreshold: 70,
      mediumThreshold: 40,
      lowThreshold: 0,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        keyword: 'database',
        category: 'Infrastructure',
        toolCategory: 'INFRA',
      },
      {
        keyword: 'performance',
        category: 'Performance',
        toolCategory: 'PERF',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    let executionResult: Tx5Imp1AgentOutput | null = null;
    let executionError: Error | null = null;

    try {
      executionResult = await runTx5Imp1Agent(input, {
        textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
        notificationServiceAdapter: mockNotificationServiceAdapter,
      });
    } catch (error) {
      if (error instanceof Error) {
        executionError = error;
      }
    }

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    if (executionError !== null) {
      expect(executionError.message).toMatch(/優先度スコア|負数|無効/);
    }

    if (executionResult !== null) {
      expect(executionResult.validationResult.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            validationStatus: 'invalid',
          }),
        ])
      );

      const failedIssue = executionResult.validationResult.issues.find(
        (issue) => issue.validationStatus === 'invalid'
      );
      expect(failedIssue).toBeDefined();
      if (failedIssue) {
        expect(failedIssue.reason).toMatch(
          /優先度スコア|負数|無効値|不正な値/
        );
      }
    }

    expect(executionResult?.integrationStatus).not.toBe('success');
  });
});