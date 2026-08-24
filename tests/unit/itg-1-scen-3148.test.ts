import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ValidatedIssue,
  ToolIntegrationResult,
  ExecutionSummary,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  let mockDb: {
    issues: Array<ExtractedIssue & { escalationFlag?: boolean; escalationReason?: string; syncStatus?: string; priority?: string; category?: string; jiraTicketId?: string; asanaTaskId?: string; syncCompletedAt?: string; syncNotificationSent?: boolean }>;
    auditLogs: Array<{ timestamp: string; action: string; result: string; escalationReason?: string; issueId: string }>;
  };

  let notificationSent: Array<{ message: string; timestamp: string }>;

  beforeEach(() => {
    mockDb = {
      issues: [
        {
        issueId: 'ISSUE-001',
        title: 'Database connection timeout',
        description: 'Frequent timeout errors on db connection pool',
        frequency: 3,
        impactScore: 75,
        reportedAt: '2024-01-15T08:00:00Z',
      } as ExtractedIssue,
      {
        issueId: 'ISSUE-002',
        title: 'Missing validation in API',
        description: 'API endpoint lacks input validation',
        frequency: 2,
        impactScore: 65,
        reportedAt: '2024-01-15T08:15:00Z',
      } as ExtractedIssue,
      {
        issueId: 'ISSUE-003',
        title: 'Memory leak in service',
        description: 'Service memory usage increases over time',
        frequency: 1,
        impactScore: 85,
        reportedAt: '2024-01-15T08:30:00Z',
      } as ExtractedIssue,
      {
        issueId: 'ISSUE-004',
        title: 'UI rendering performance',
        description: 'Page load time exceeds 5 seconds',
        frequency: 4,
        impactScore: 55,
        reportedAt: '2024-01-15T08:45:00Z',
      } as ExtractedIssue,
      {
        issueId: 'ISSUE-005',
        title: 'Feature enhancement request',
        description: 'Add export to CSV capability and bug fix for pagination',
        frequency: 2,
        impactScore: 60,
        reportedAt: '2024-01-15T09:00:00Z',
      } as ExtractedIssue,
      ],
      auditLogs: [],
    };
    notificationSent = [];
  });

  afterEach(() => {
    mockDb.issues = [];
    mockDb.auditLogs = [];
    notificationSent = [];
  });

  // SCEN-3148
  test('should validate issues, auto-judge priority and category, detect escalation conditions, and sync with external tools', async () => {
    const fakeAiClient: Tx5Imp1AiClient = {
      validateIssueFormat: async (issue: ExtractedIssue) => {
        return {
          isValid: true,
          errors: [],
          confidence: 0.98,
        };
      },

      judgePriorityAndCategory: async (issue: ExtractedIssue) => {
        if (issue.issueId === 'ISSUE-001') {
          return {
            priorityScore: 78,
            priorityRank: 'high',
            category: 'インシデント',
            confidence: 0.94,
          };
        }
        if (issue.issueId === 'ISSUE-002') {
          return {
            priorityScore: 62,
            priorityRank: 'medium',
            category: 'バグ',
            confidence: 0.92,
          };
        }
        if (issue.issueId === 'ISSUE-003') {
          return {
            priorityScore: 88,
            priorityRank: 'high',
            category: 'インシデント',
            confidence: 0.95,
          };
        }
        if (issue.issueId === 'ISSUE-004') {
          return {
            priorityScore: 55,
            priorityRank: 'low',
            category: '機能追加',
            confidence: 0.93,
          };
        }
        if (issue.issueId === 'ISSUE-005') {
          return {
            priorityScore: 65,
            priorityRank: 'medium',
            category: 'バグ,機能追加',
            confidence: 0.78,
          };
        }
        return {
          priorityScore: 50,
          priorityRank: 'low',
          category: 'その他',
          confidence: 0.50,
        };
      },

      configureToolIntegration: async (
        issue: ExtractedIssue & {
          priorityScore?: number;
          priorityRank?: string;
          category?: string;
        }
      ) => {
        if (issue.issueId === 'ISSUE-004') {
          throw new Error('connection timeout');
        }
        return {
          toolType: issue.issueId === 'ISSUE-005' ? 'asana' : 'jira',
          toolProjectId: 'PROJ-001',
          toolFieldMappings: {
            priority: 'customfield_10000',
            category: 'customfield_10001',
          },
        };
      },

      registerToExternalTool: async (
        issue: ExtractedIssue & {
          priorityScore?: number;
          priorityRank?: string;
          category?: string;
        },
        toolConfig: any
      ) => {
        if (issue.issueId === 'ISSUE-005') {
          return {
            success: false,
            toolIssueId: null,
            errorMessage: 'Multiple categories require manual classification',
          };
        }
        return {
          success: true,
          toolIssueId: `JIRA-${parseInt(issue.issueId.split('-')[1])}`,
          errorMessage: null,
        };
      },

      recordSyncStatus: async (
        issue: ExtractedIssue & {
          priorityScore?: number;
          priorityRank?: string;
          category?: string;
          toolIssueId?: string;
          syncStatus?: string;
        }
      ) => {
        return {
          syncStatus: 'SYNCED',
          syncCompletedAt: '2024-01-15T09:30:00Z',
          syncNotificationSent: true,
        };
      },
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueData: mockDb.issues,
      toolIntegrationConfig: {
        jiraBaseUrl: 'https://jira.example.com',
        jiraApiToken: 'token-xxx',
        asanaWorkspaceId: 'workspace-yyy',
      },
      priorityRules: {
        frequencyWeight: 0.3,
        impactWeight: 0.7,
        highThreshold: 75,
        mediumThreshold: 50,
      },
      categoryMappings: [
        { systemCategory: 'インシデント', toolCategory: 'BUG' },
        { systemCategory: 'バグ', toolCategory: 'BUG' },
        { systemCategory: '機能追加', toolCategory: 'FEATURE' },
      ],
    };

    const output: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, fakeAiClient);

    // Validation: All 5 issues passed schema validation
    expect(output.validatedIssues).toHaveLength(5);
    expect(output.validatedIssues.every((issue) => issue.validationStatus === 'valid' || issue.validationStatus === 'warning')).toBe(true);

    // Assertion: Issues 1-4 have priority and category assigned
    const issue1 = output.validatedIssues.find((i) => i.issueId === 'ISSUE-001');
    expect(issue1).toBeDefined();
    expect(issue1!.priorityScore).toBe(78);
    expect(issue1!.priorityRank).toBe('high');
    expect(issue1!.category).toBe('インシデント');
    expect(issue1!.validationStatus).toBe('valid');

    const issue2 = output.validatedIssues.find((i) => i.issueId === 'ISSUE-002');
    expect(issue2).toBeDefined();
    expect(issue2!.priorityScore).toBe(62);
    expect(issue2!.priorityRank).toBe('medium');
    expect(issue2!.category).toBe('バグ');
    expect(issue2!.validationStatus).toBe('valid');

    const issue3 = output.validatedIssues.find((i) => i.issueId === 'ISSUE-003');
    expect(issue3).toBeDefined();
    expect(issue3!.priorityScore).toBe(88);
    expect(issue3!.priorityRank).toBe('high');
    expect(issue3!.category).toBe('インシデント');
    expect(issue3!.validationStatus).toBe('valid');

    // Assertion: Issue 4 escalation - tool integration failure
    const issue4 = output.validatedIssues.find((i) => i.issueId === 'ISSUE-004');
    expect(issue4).toBeDefined();
    expect(issue4!.priorityScore).toBe(55);
    expect(issue4!.priorityRank).toBe('low');
    expect(issue4!.category).toBe('機能追加');
    expect(issue4!.validationStatus).toBe('warning');

    // Assertion: Issue 5 escalation - multiple categories
    const issue5 = output.validatedIssues.find((i) => i.issueId === 'ISSUE-005');
    expect(issue5).toBeDefined();
    expect(issue5!.priorityScore).toBe(65);
    expect(issue5!.priorityRank).toBe('medium');
    expect(issue5!.validationStatus).toBe('warning');

    // Assertion: Integration results - issues 1-3 synced successfully
    expect(output.integrationResult.successfulSyncs).toBeGreaterThanOrEqual(3);
    expect(output.integrationResult.failedSyncs).toBeGreaterThanOrEqual(1);

    // Assertion: Execution summary contains all required audit trail
    expect(output.executionSummary.processedCount).toBe(5);
    expect(output.executionSummary.escalatedCount).toBeGreaterThanOrEqual(2);
    expect(output.executionSummary.startedAt).toBeDefined();
    expect(output.executionSummary.completedAt).toBeDefined();

    // Assertion: Tool issue IDs assigned for successfully synced issues
    expect(issue1!.toolIssueId).toBeDefined();
    expect(issue1!.toolIssueId).not.toBeNull();
    expect(issue3!.toolIssueId).toBeDefined();
    expect(issue3!.toolIssueId).not.toBeNull();

    // Assertion: Escalated issues marked appropriately
    const escalatedIssues = output.validatedIssues.filter((i) => i.validationStatus === 'warning');
    expect(escalatedIssues.length).toBeGreaterThanOrEqual(2);

    // Assertion: Integration result contains failure details
    if (output.integrationResult.retryInfo && output.integrationResult.retryInfo.length > 0) {
      const retryEntry = output.integrationResult.retryInfo[0];
      expect(retryEntry.issueId).toBeDefined();
      expect(retryEntry.attemptCount).toBeGreaterThanOrEqual(0);
    }
  });
});