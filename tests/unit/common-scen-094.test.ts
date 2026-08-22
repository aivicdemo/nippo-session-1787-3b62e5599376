import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
  ExtractedIssue,
  ValidatedIssue,
  ToolIntegrationConfig,
  PriorityRuleSet,
  CategoryMapping,
  ToolIntegrationResult,
  ExecutionSummary,
} from '../../src/agents/tx-5-imp-1/types';
import {
  buildAction01Prompt,
  ACTION_01_PROMPT_VERSION,
} from '../../src/agents/tx-5-imp-1/prompts/action-01';
import {
  buildAction02Prompt,
  ACTION_02_PROMPT_VERSION,
} from '../../src/agents/tx-5-imp-1/prompts/action-02';
import {
  buildAction03Prompt,
  ACTION_03_PROMPT_VERSION,
} from '../../src/agents/tx-5-imp-1/prompts/action-03';
import {
  buildAction04Prompt,
  ACTION_04_PROMPT_VERSION,
} from '../../src/agents/tx-5-imp-1/prompts/action-04';
import {
  buildAction05Prompt,
  ACTION_05_PROMPT_VERSION,
} from '../../src/agents/tx-5-imp-1/prompts/action-05';

const fetchMock = require('jest-fetch-mock');

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  // SCEN-094
  test('should complete issue validation and registration to existing tools autonomously', async () => {
    const now = new Date('2024-02-15T09:00:00Z');
    const startTime = now.toISOString();
    const registeredAtTime = new Date('2024-02-15T09:05:00Z').toISOString();

    // Input: Multiple extracted issues with different priorities and categories
    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'ISSUE-001',
        title: 'Database performance degradation',
        description: 'Query response time exceeds 5 seconds',
        category: 'Performance',
        severity: 'high',
        frequency: 3,
        impactScope: 'production',
      },
      {
        issueId: 'ISSUE-002',
        title: 'UI responsiveness lag',
        description: 'Button click response delay of 2 seconds',
        category: 'UI/UX',
        severity: 'medium',
        frequency: 5,
        impactScope: 'user-facing',
      },
      {
        issueId: 'ISSUE-003',
        title: 'API integration timeout',
        description: 'Third-party API calls timeout after 30 seconds',
        category: 'Integration',
        severity: 'high',
        frequency: 2,
        impactScope: 'production',
      },
    ];

    const toolIntegrationConfig: ToolIntegrationConfig = {
      jiraProjectKey: 'ENG',
      jiraBaseUrl: 'https://jira.example.com',
      asanaProjectGid: '1234567890',
      asanaBaseUrl: 'https://api.asana.com',
      selectedTool: 'both',
    };

    const priorityRules: PriorityRuleSet = {
      frequencyWeight: 0.3,
      severityWeight: 0.5,
      scopeWeight: 0.2,
      highSeverityThreshold: 70,
      mediumSeverityThreshold: 40,
      confidenceThreshold: 0.75,
    };

    const categoryMappings: CategoryMapping[] = [
      {
        sourceName: 'Performance',
        jiraCategory: 'Technical Debt',
        asanaCategory: 'Infrastructure',
      },
      {
        sourceName: 'UI/UX',
        jiraCategory: 'Frontend',
        asanaCategory: 'Product',
      },
      {
        sourceName: 'Integration',
        jiraCategory: 'Backend',
        asanaCategory: 'Integration',
      },
    ];

    const input: Tx5Imp1AgentInput = {
      extractedIssueData: extractedIssues,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings,
    };

    // Mock Jira API calls
    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: 'JIRA-10001',
        key: 'ENG-1001',
        self: 'https://jira.example.com/rest/api/3/issues/JIRA-10001',
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: 'JIRA-10002',
        key: 'ENG-1002',
        self: 'https://jira.example.com/rest/api/3/issues/JIRA-10002',
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: 'JIRA-10003',
        key: 'ENG-1003',
        self: 'https://jira.example.com/rest/api/3/issues/JIRA-10003',
      }),
      { status: 200 }
    );

    // Mock Asana API calls
    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: {
          gid: 'ASANA-1001',
          name: 'Database performance degradation',
        },
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: {
          gid: 'ASANA-1002',
          name: 'UI responsiveness lag',
        },
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: {
          gid: 'ASANA-1003',
          name: 'API integration timeout',
        },
      }),
      { status: 200 }
    );

    // Create mock AI client
    const mockAiClient = {
      action01_ValidateIssueData: jest.fn().mockResolvedValue({
        validationResults: extractedIssues.map((issue) => ({
          issueId: issue.issueId,
          isValid: true,
          errors: [],
        })),
      }),

      action02_JudgePriorityAndCategory: jest.fn().mockResolvedValue({
        judgments: extractedIssues.map((issue, index) => ({
          issueId: issue.issueId,
          priorityScore: index === 0 ? 85 : index === 1 ? 55 : 80,
          priorityRank: index === 0 ? 'high' : index === 1 ? 'medium' : 'high',
          category: issue.category,
          confidence: 0.92,
        })),
      }),

      action03_DecideToolMapping: jest.fn().mockResolvedValue({
        toolMappings: extractedIssues.map((issue, index) => ({
          issueId: issue.issueId,
          selectedTool: index % 2 === 0 ? 'Jira' : 'Asana',
          mappedCategory:
            index === 0
              ? 'Technical Debt'
              : index === 1
                ? 'Frontend'
                : 'Backend',
        })),
      }),

      action04_RegisterToExternalTool: jest.fn().mockResolvedValue({
        registrationResults: extractedIssues.map((issue, index) => ({
          issueId: issue.issueId,
          toolIssueId:
            index % 2 === 0 ? `JIRA-${10001 + index}` : `ASANA-${1001 + index}`,
          toolName: index % 2 === 0 ? 'Jira' : 'Asana',
          success: true,
          timestamp: registeredAtTime,
        })),
      }),

      action05_RecordAndNotifyCompletion: jest.fn().mockResolvedValue({
        completionNotifications: extractedIssues.map((issue, index) => ({
          issueId: issue.issueId,
          status: 'registered',
          toolName: index % 2 === 0 ? 'Jira' : 'Asana',
          toolIssueId:
            index % 2 === 0 ? `JIRA-${10001 + index}` : `ASANA-${1001 + index}`,
          registeredAt: registeredAtTime,
        })),
      }),
    };

    // Execute orchestrator
    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, mockAiClient as any);

    // Verify Action 1 was called with validation prompt
    expect(mockAiClient.action01_ValidateIssueData).toHaveBeenCalled();
    const action01Call = mockAiClient.action01_ValidateIssueData.mock.calls[0];
    expect(action01Call[0]).toContain('ACTION_01_PROMPT_VERSION');

    // Verify Action 2 was called with priority judgment prompt
    expect(mockAiClient.action02_JudgePriorityAndCategory).toHaveBeenCalled();
    const action02Call = mockAiClient.action02_JudgePriorityAndCategory.mock.calls[0];
    expect(action02Call[0]).toContain('ACTION_02_PROMPT_VERSION');

    // Verify Action 3 was called with tool mapping prompt
    expect(mockAiClient.action03_DecideToolMapping).toHaveBeenCalled();
    const action03Call = mockAiClient.action03_DecideToolMapping.mock.calls[0];
    expect(action03Call[0]).toContain('ACTION_03_PROMPT_VERSION');

    // Verify Action 4 was called with registration prompt
    expect(mockAiClient.action04_RegisterToExternalTool).toHaveBeenCalled();
    const action04Call = mockAiClient.action04_RegisterToExternalTool.mock.calls[0];
    expect(action04Call[0]).toContain('ACTION_04_PROMPT_VERSION');

    // Verify Action 5 was called with completion notification prompt
    expect(mockAiClient.action05_RecordAndNotifyCompletion).toHaveBeenCalled();
    const action05Call = mockAiClient.action05_RecordAndNotifyCompletion.mock.calls[0];
    expect(action05Call[0]).toContain('ACTION_05_PROMPT_VERSION');

    // Verify validated issues count matches input
    expect(result.validatedIssues).toHaveLength(3);

    // Verify each validated issue has required fields
    result.validatedIssues.forEach((issue: ValidatedIssue, index: number) => {
      expect(issue.issueId).toBe(`ISSUE-${String(index + 1).padStart(3, '0')}`);
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(issue.priorityRank);
      expect(issue.category).toBeDefined();
      expect(issue.validationStatus).toBe('valid');
      expect(['Jira', 'Asana']).toContain(issue.toolIssueId ? 'registered' : 'valid');
    });

    // Verify integration result
    const integrationResult: ToolIntegrationResult = result.integrationResult;
    expect(integrationResult.successCount).toBe(3);
    expect(integrationResult.failureCount).toBe(0);
    expect(integrationResult.toolRegistrations).toHaveLength(3);

    integrationResult.toolRegistrations.forEach((registration, index: number) => {
      expect(registration.issueId).toBe(`ISSUE-${String(index + 1).padStart(3, '0')}`);
      expect(['Jira', 'Asana']).toContain(registration.toolName);
      expect(registration.toolIssueId).toBeDefined();
      expect(registration.registeredAt).toBe(registeredAtTime);
    });

    // Verify execution summary
    const summary: ExecutionSummary = result.executionSummary;
    expect(summary.status).toBe('completed');
    expect(summary.totalProcessed).toBe(3);
    expect(summary.startTime).toBe(startTime);
    expect(summary.endTime).toBeDefined();
    expect(summary.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(summary.promptVersions).toEqual({
      action01: ACTION_01_PROMPT_VERSION,
      action02: ACTION_02_PROMPT_VERSION,
      action03: ACTION_03_PROMPT_VERSION,
      action04: ACTION_04_PROMPT_VERSION,
      action05: ACTION_05_PROMPT_VERSION,
    });

    // Verify no escalations for normal cases
    expect(result.validatedIssues.every((issue) => issue.validationStatus !== 'invalid')).toBe(
      true
    );
  });
});