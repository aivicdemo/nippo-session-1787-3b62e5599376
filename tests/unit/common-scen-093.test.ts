import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
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

describe('tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-093: [normal] 課題抽出から既存ツール連携・確認までの自律実行 AIエージェント - 正常系・完全実行
  test('should execute autonomous issue extraction, validation, and tool integration end-to-end', async () => {
    const mockJiraApiClient = {
      createIssue: jest.fn().mockResolvedValue({
        id: 'JIRA-001',
        key: 'PROJ-123',
      }),
    };

    const mockAsanaApiClient = {
      createTask: jest.fn().mockResolvedValue({
        id: '1234567890',
        gid: '1234567890',
      }),
    };

    const mockAiClient = {
      validateExtractedIssues: jest
        .fn()
        .mockResolvedValue([
          {
            issueId: 'issue-001',
            priorityScore: 85,
            priorityRank: 'high',
            category: 'Quality',
            validationStatus: 'valid',
          },
        ]),
      determineToolMapping: jest.fn().mockResolvedValue({
        targetTools: ['jira', 'asana'],
      }),
      executeToolIntegration: jest.fn().mockResolvedValue({
        jiraResults: [
          {
            issueId: 'issue-001',
            toolIssueId: 'PROJ-123',
            status: 'linked',
          },
        ],
        asanaResults: [
          {
            issueId: 'issue-001',
            toolIssueId: '1234567890',
            status: 'linked',
          },
        ],
      }),
      recordLinkageStatus: jest.fn().mockResolvedValue({
        recordedAt: '2024-01-15T11:00:00Z',
        count: 2,
      }),
      generateAuditLog: jest.fn().mockResolvedValue([
        {
          action: 'validate',
          timestamp: '2024-01-15T11:00:00Z',
          promptVersion: ACTION_01_PROMPT_VERSION,
        },
        {
          action: 'mapTools',
          timestamp: '2024-01-15T11:00:05Z',
          promptVersion: ACTION_02_PROMPT_VERSION,
        },
        {
          action: 'executeIntegration',
          timestamp: '2024-01-15T11:00:10Z',
          promptVersion: ACTION_03_PROMPT_VERSION,
        },
        {
          action: 'recordLinkage',
          timestamp: '2024-01-15T11:00:15Z',
          promptVersion: ACTION_05_PROMPT_VERSION,
        },
      ]),
    };

    const mockToolIntegrationConfig = {
      jira: {
        apiUrl: 'https://jira.example.com',
        token: 'mock-jira-token',
      },
      asana: {
        apiUrl: 'https://app.asana.com/api/1.0',
        token: 'mock-asana-token',
      },
    };

    const mockPriorityRules = {
      impactWeighting: 0.4,
      frequencyWeighting: 0.3,
      urgencyWeighting: 0.3,
      thresholds: {
        high: 75,
        medium: 50,
        low: 0,
      },
    };

    const mockCategoryMappings = [
      {
        systemCategory: 'Quality',
        jiraCategory: 'Bug',
        asanaCategory: 'Quality Issue',
      },
      {
        systemCategory: 'Delivery',
        jiraCategory: 'Task',
        asanaCategory: 'Delivery Task',
      },
    ];

    const mockInput = {
      extractedIssueData: [
        {
          issueId: 'issue-001',
          title: 'API response delay in production',
          description: 'Performance issue affecting user experience',
          detectedAt: '2024-01-15T10:00:00Z',
          severity: 'high',
          affectedComponents: ['API_SERVER'],
        },
      ],
      toolIntegrationConfig: mockToolIntegrationConfig,
      priorityRules: mockPriorityRules,
      categoryMappings: mockCategoryMappings,
    };

    // Verify prompt modules are loaded correctly
    expect(ACTION_01_PROMPT_VERSION).toBeDefined();
    expect(ACTION_02_PROMPT_VERSION).toBeDefined();
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(ACTION_04_PROMPT_VERSION).toBeDefined();
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();

    const action01Prompt = buildAction01Prompt(mockInput.extractedIssueData);
    const action02Prompt = buildAction02Prompt(
      mockInput.extractedIssueData,
      mockInput.categoryMappings
    );
    const action03Prompt = buildAction03Prompt(
      mockInput.extractedIssueData,
      mockInput.toolIntegrationConfig
    );

    expect(action01Prompt).toContain('validate');
    expect(action02Prompt).toContain('map');
    expect(action03Prompt).toContain('integrate');

    // Execute agent with mocked AI client
    const result = await runTx5Imp1Agent(mockInput, mockAiClient);

    // Verify AI client method invocations
    expect(mockAiClient.validateExtractedIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.validateExtractedIssues).toHaveBeenCalledWith(
      mockInput.extractedIssueData
    );

    expect(mockAiClient.determineToolMapping).toHaveBeenCalledTimes(1);

    expect(mockAiClient.executeToolIntegration).toHaveBeenCalledTimes(1);

    expect(mockAiClient.recordLinkageStatus).toHaveBeenCalledTimes(1);

    expect(mockAiClient.generateAuditLog).toHaveBeenCalledTimes(1);

    // Verify result structure
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);

    expect(result).toHaveProperty('linkedIssueIds');
    expect(Array.isArray(result.linkedIssueIds)).toBe(true);
    expect(result.linkedIssueIds.length).toBe(1);
    expect(result.linkedIssueIds[0]).toBe('PROJ-123');

    expect(result).toHaveProperty('linkedTaskIds');
    expect(Array.isArray(result.linkedTaskIds)).toBe(true);
    expect(result.linkedTaskIds.length).toBe(1);
    expect(result.linkedTaskIds[0]).toBe('1234567890');

    expect(result).toHaveProperty('timestamp');
    expect(typeof result.timestamp).toBe('string');
    expect(new Date(result.timestamp).toISOString()).toBe(
      '2024-01-15T11:00:15Z'
    );

    expect(result).toHaveProperty('auditLog');
    expect(Array.isArray(result.auditLog)).toBe(true);
    expect(result.auditLog.length).toBe(4);

    // Verify audit log entries contain expected structure
    expect(result.auditLog[0]).toEqual({
      action: 'validate',
      timestamp: '2024-01-15T11:00:00Z',
      promptVersion: ACTION_01_PROMPT_VERSION,
    });

    expect(result.auditLog[2]).toEqual({
      action: 'executeIntegration',
      timestamp: '2024-01-15T11:00:10Z',
      promptVersion: ACTION_03_PROMPT_VERSION,
    });

    expect(result.auditLog[3]).toEqual({
      action: 'recordLinkage',
      timestamp: '2024-01-15T11:00:15Z',
      promptVersion: ACTION_05_PROMPT_VERSION,
    });

    // Verify that Jira API was called with correct parameters
    expect(mockJiraApiClient.createIssue).toHaveBeenCalledWith({
      key: 'PROJ-123',
      issueType: 'Bug',
      summary: 'API response delay in production',
      priority: 'High',
    });

    // Verify that Asana API was called with correct parameters
    expect(mockAsanaApiClient.createTask).toHaveBeenCalledWith({
      gid: '1234567890',
      name: 'API response delay in production',
      custom_fields: {
        priority: 'High',
        category: 'Quality Issue',
      },
    });

    // Verify no external API calls were made directly
    expect(global.fetch).not.toHaveBeenCalled();
  });
});