import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient, type ExtractedIssue, type ToolIntegrationConfig, type PriorityRuleSet, type CategoryMapping, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 Agent - Orchestrator', () => {
  // SCEN-3160: [normal] 課題抽出から既存ツール連携・確認までの自律実行 AIエージェント - 監査記録の時系列完全記録
  test('should record all agent lifecycle events in audit log with correct sequence and handoff information', async () => {
    const auditLog: Array<{
      eventType: string;
      timestamp: string;
      agentId: string;
      actionIndex?: number;
      result?: Record<string, unknown>;
      toolIntegrationDetails?: Record<string, unknown>;
      processedCount?: number;
      status?: string;
    }> = [];

    const mockAiClient: Tx5Imp1AiClient = {
      callAction01: jest.fn(async (prompt: string) => {
        auditLog.push({
          eventType: 'ACTION_01',
          timestamp: new Date('2024-01-15T09:00:01Z').toISOString(),
          agentId: 'tx-5-imp-1',
          actionIndex: 1,
          result: { validationStatus: 'passed', issuesValidated: 5 }
        });
        return {
          validated: true,
          issueCount: 5,
          errors: []
        };
      }),
      callAction02: jest.fn(async (prompt: string) => {
        auditLog.push({
          eventType: 'ACTION_02',
          timestamp: new Date('2024-01-15T09:00:02Z').toISOString(),
          agentId: 'tx-5-imp-1',
          actionIndex: 2,
          result: { priorityJudgmentCount: 5, categoriesAssigned: 5 }
        });
        return {
          priorityScores: [
            { issueId: 'issue-001', score: 85, category: 'quality' },
            { issueId: 'issue-002', score: 72, category: 'schedule' },
            { issueId: 'issue-003', score: 65, category: 'performance' },
            { issueId: 'issue-004', score: 58, category: 'quality' },
            { issueId: 'issue-005', score: 45, category: 'infrastructure' }
          ]
        };
      }),
      callAction03: jest.fn(async (prompt: string) => {
        auditLog.push({
          eventType: 'ACTION_03',
          timestamp: new Date('2024-01-15T09:00:03Z').toISOString(),
          agentId: 'tx-5-imp-1',
          actionIndex: 3,
          result: { configurationStatus: 'ready', toolType: 'jira' }
        });
        return {
          toolType: 'jira',
          configStatus: 'configured',
          apiEndpoint: 'https://jira.example.com/api/v3'
        };
      }),
      callAction04: jest.fn(async (prompt: string) => {
        auditLog.push({
          eventType: 'ACTION_04',
          timestamp: new Date('2024-01-15T09:00:04Z').toISOString(),
          agentId: 'tx-5-imp-1',
          actionIndex: 4,
          toolIntegrationDetails: {
            jiraSuccessCount: 5,
            asanaSuccessCount: 0,
            failureCount: 0,
            createdIssueIds: ['PROJ-001', 'PROJ-002', 'PROJ-003', 'PROJ-004', 'PROJ-005']
          }
        });
        return {
          successCount: 5,
          failureCount: 0,
          createdToolIssueIds: ['PROJ-001', 'PROJ-002', 'PROJ-003', 'PROJ-004', 'PROJ-005']
        };
      }),
      callAction05: jest.fn(async (prompt: string) => {
        auditLog.push({
          eventType: 'ACTION_05',
          timestamp: new Date('2024-01-15T09:00:05Z').toISOString(),
          agentId: 'tx-5-imp-1',
          actionIndex: 5,
          result: { notificationSent: true, statusRecorded: true }
        });
        return {
          statusRecorded: true,
          notificationDelivered: true
        };
      })
    };

    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        text: 'Database performance degradation detected in production',
        sourceReportId: 'report-20240115-001'
      },
      {
        issueId: 'issue-002',
        text: 'Deployment pipeline delays impacting release schedule',
        sourceReportId: 'report-20240115-002'
      },
      {
        issueId: 'issue-003',
        text: 'Memory leak in service module causing intermittent failures',
        sourceReportId: 'report-20240115-003'
      },
      {
        issueId: 'issue-004',
        text: 'Code review bottleneck slowing down PR merges',
        sourceReportId: 'report-20240115-004'
      },
      {
        issueId: 'issue-005',
        text: 'Infrastructure monitoring gaps in edge locations',
        sourceReportId: 'report-20240115-005'
      }
    ];

    const toolConfig: ToolIntegrationConfig = {
      toolType: 'jira',
      apiKey: 'test-key-placeholder',
      projectKey: 'PROJ'
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      thresholds: { high: 75, medium: 50, low: 0 }
    };

    const categoryMappings: CategoryMapping[] = [
      { extractedCategory: 'quality', toolCategory: 'Bug' },
      { extractedCategory: 'schedule', toolCategory: 'Task' },
      { extractedCategory: 'performance', toolCategory: 'Epic' },
      { extractedCategory: 'infrastructure', toolCategory: 'Technical Debt' }
    ];

    auditLog.push({
      eventType: 'START',
      timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
      agentId: 'tx-5-imp-1',
      result: { initiationStatus: 'started' }
    });

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(
      {
        extractedIssueData: extractedIssues,
        toolIntegrationConfig: toolConfig,
        priorityRules: priorityRules,
        categoryMappings: categoryMappings
      },
      mockAiClient
    );

    auditLog.push({
      eventType: 'COMPLETION',
      timestamp: new Date('2024-01-15T09:00:06Z').toISOString(),
      agentId: 'tx-5-imp-1',
      processedCount: 5,
      status: 'SUCCESS',
      result: { completionStatus: 'all_actions_completed' }
    });

    expect(auditLog).toHaveLength(8);

    expect(auditLog[0].eventType).toBe('START');
    expect(auditLog[0].agentId).toBe('tx-5-imp-1');
    expect(auditLog[0].timestamp).toBe('2024-01-15T09:00:00Z');

    expect(auditLog[1].eventType).toBe('ACTION_01');
    expect(auditLog[1].agentId).toBe('tx-5-imp-1');
    expect(auditLog[1].timestamp).toBe('2024-01-15T09:00:01Z');
    expect(auditLog[1].result?.validationStatus).toBe('passed');

    expect(auditLog[2].eventType).toBe('ACTION_02');
    expect(auditLog[2].agentId).toBe('tx-5-imp-1');
    expect(auditLog[2].timestamp).toBe('2024-01-15T09:00:02Z');
    expect(auditLog[2].result?.priorityJudgmentCount).toBe(5);

    expect(auditLog[3].eventType).toBe('ACTION_03');
    expect(auditLog[3].agentId).toBe('tx-5-imp-1');
    expect(auditLog[3].timestamp).toBe('2024-01-15T09:00:03Z');
    expect(auditLog[3].result?.configurationStatus).toBe('ready');

    expect(auditLog[4].eventType).toBe('ACTION_04');
    expect(auditLog[4].agentId).toBe('tx-5-imp-1');
    expect(auditLog[4].timestamp).toBe('2024-01-15T09:00:04Z');
    expect(auditLog[4].toolIntegrationDetails?.jiraSuccessCount).toBe(5);
    expect(auditLog[4].toolIntegrationDetails?.failureCount).toBe(0);

    expect(auditLog[5].eventType).toBe('ACTION_05');
    expect(auditLog[5].agentId).toBe('tx-5-imp-1');
    expect(auditLog[5].timestamp).toBe('2024-01-15T09:00:05Z');
    expect(auditLog[5].result?.notificationSent).toBe(true);

    expect(auditLog[6].eventType).toBe('COMPLETION');
    expect(auditLog[6].agentId).toBe('tx-5-imp-1');
    expect(auditLog[6].timestamp).toBe('2024-01-15T09:00:06Z');
    expect(auditLog[6].processedCount).toBe(5);
    expect(auditLog[6].status).toBe('SUCCESS');

    const eventSequence = auditLog.map(log => log.eventType);
    expect(eventSequence).toEqual([
      'START',
      'ACTION_01',
      'ACTION_02',
      'ACTION_03',
      'ACTION_04',
      'ACTION_05',
      'COMPLETION'
    ]);

    for (let i = 0; i < auditLog.length - 1; i++) {
      const current = new Date(auditLog[i].timestamp).getTime();
      const next = new Date(auditLog[i + 1].timestamp).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }

    expect(result.validatedIssues).toHaveLength(5);
    expect(result.validatedIssues[0].issueId).toBe('issue-001');
    expect(result.validatedIssues[0].priorityScore).toBe(85);
    expect(result.validatedIssues[0].priorityRank).toBe('high');
    expect(result.validatedIssues[0].category).toBe('quality');

    expect(result.integrationResult.success).toBe(true);
    expect(result.integrationResult.successCount).toBe(5);
    expect(result.integrationResult.failureCount).toBe(0);

    expect(result.executionSummary.status).toBe('SUCCESS');
    expect(result.executionSummary.processedIssueCount).toBe(5);
    expect(result.executionSummary.actionCount).toBe(5);

    expect(mockAiClient.callAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction03).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction04).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction05).toHaveBeenCalledTimes(1);
  });
});