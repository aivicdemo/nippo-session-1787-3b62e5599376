import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-5-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-5-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-5-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-5-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-5-imp-1/prompts/action-05';

describe('Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  test('SCEN-3150: runTx5Imp1Agent が課題抽出・既存ツール連携・通知まで完全に実行する', async () => {
    const extracted_issue_data = [
      {
        issueId: 'ISSUE-001',
        title: 'データベース接続タイムアウト',
        description: '本番環境でDBコネクションプール枯渇',
        frequency: 5,
        impactScore: 95,
        category: 'performance',
        confidenceScore: 0.95,
      },
      {
        issueId: 'ISSUE-002',
        title: 'API レスポンス遅延',
        description: '外部APIの呼び出し遅延による全体系遅延',
        frequency: 3,
        impactScore: 78,
        category: 'performance',
        confidenceScore: 0.88,
      },
      {
        issueId: 'ISSUE-003',
        title: 'ユーザー認証エラー',
        description: 'LDAP連携時の認証タイムアウト',
        frequency: 2,
        impactScore: 62,
        category: 'security',
        confidenceScore: 0.75,
      },
      {
        issueId: 'ISSUE-004',
        title: '複合課題：キャッシュ無効化とメモリリーク',
        description: 'キャッシュ無効化時にメモリリークが発生',
        frequency: 1,
        impactScore: 45,
        category: 'performance|reliability',
        confidenceScore: 0.68,
      },
      {
        issueId: 'ISSUE-005',
        title: 'ドキュメント不整合',
        description: 'APIドキュメントと実装の不整合',
        frequency: 2,
        impactScore: 35,
        category: 'documentation',
        confidenceScore: 0.72,
      },
    ];

    const tool_integration_config = {
      targetTool: 'jira' as const,
      jiraBaseUrl: 'https://jira.example.com',
      jiraProjectKey: 'PROJ',
      asanaWorkspaceId: 'workspace-123',
      authMethod: 'api_token' as const,
    };

    const priority_rules = {
      frequency_weight: 0.4,
      impact_weight: 0.6,
      high_threshold: 75,
      medium_threshold: 50,
      low_threshold: 0,
    };

    const category_mappings = [
      {
        source_category: 'performance',
        target_jira_type: 'Bug',
        target_asana_section: 'Performance',
      },
      {
        source_category: 'security',
        target_jira_type: 'Security',
        target_asana_section: 'Security',
      },
      {
        source_category: 'reliability',
        target_jira_type: 'Improvement',
        target_asana_section: 'Reliability',
      },
      {
        source_category: 'documentation',
        target_jira_type: 'Task',
        target_asana_section: 'Documentation',
      },
    ];

    const mock_ai_client = {
      async executeAction(action_name: string, prompt_text: string): Promise<string> {
        if (action_name === 'action-01') {
          return JSON.stringify({
            validation_status: 'valid',
            format_errors: [],
            content_validity_score: 0.92,
            issues_validated: 5,
          });
        }
        if (action_name === 'action-02') {
          return JSON.stringify({
            judgments: [
              { issueId: 'ISSUE-001', priorityScore: 89, priorityRank: 'high', category: 'performance' },
              { issueId: 'ISSUE-002', priorityScore: 72, priorityRank: 'high', category: 'performance' },
              { issueId: 'ISSUE-003', priorityScore: 60, priorityRank: 'medium', category: 'security' },
              { issueId: 'ISSUE-004', priorityScore: 42, priorityRank: 'medium', category: 'performance' },
              { issueId: 'ISSUE-005', priorityScore: 36, priorityRank: 'low', category: 'documentation' },
            ],
          });
        }
        if (action_name === 'action-03') {
          return JSON.stringify({
            integration_status: 'configured',
            target_tool: 'jira',
            auth_verified: true,
            project_mapping_confirmed: true,
          });
        }
        if (action_name === 'action-04') {
          return JSON.stringify({
            registration_results: [
              { issueId: 'ISSUE-001', tool_issue_id: 'PROJ-1001', status: 'registered_in_jira' },
              { issueId: 'ISSUE-002', tool_issue_id: 'PROJ-1002', status: 'registered_in_jira' },
              { issueId: 'ISSUE-003', tool_issue_id: 'PROJ-1003', status: 'registered_in_jira' },
              { issueId: 'ISSUE-004', tool_issue_id: 'PROJ-1004', status: 'registered_in_jira' },
              { issueId: 'ISSUE-005', tool_issue_id: 'PROJ-1005', status: 'registered_in_jira' },
            ],
            total_registered: 5,
            failures: 0,
          });
        }
        if (action_name === 'action-05') {
          return JSON.stringify({
            notification_status: 'sent',
            notification_count: 1,
            completion_log_recorded: true,
            issues_status_updated: 5,
          });
        }
        return JSON.stringify({});
      },
    };

    const mock_notification_adapter = {
      async sendReminderNotification(user_id: string, message: string): Promise<{ status: string; timestamp: string }> {
        return {
          status: 'delivered',
          timestamp: new Date('2024-01-15T12:00:00Z').toISOString(),
        };
      },
    };

    expect(typeof buildAction01Prompt).toBe('function');
    expect(typeof ACTION_01_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction02Prompt).toBe('function');
    expect(typeof ACTION_02_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction03Prompt).toBe('function');
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction04Prompt).toBe('function');
    expect(typeof ACTION_04_PROMPT_VERSION).toBe('string');
    expect(typeof buildAction05Prompt).toBe('function');
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');

    const orchestrator_input = {
      extractedIssueData: extracted_issue_data,
      toolIntegrationConfig: tool_integration_config,
      priorityRules: priority_rules,
      categoryMappings: category_mappings,
    };

    const result = await runTx5Imp1Agent(orchestrator_input, mock_ai_client as any);

    expect(result).toBeDefined();
    expect(result.validatedIssues).toBeDefined();
    expect(Array.isArray(result.validatedIssues)).toBe(true);
    expect(result.validatedIssues.length).toBe(5);

    const registered_issue_ids = result.validatedIssues.map((issue: any) => issue.issueId);
    expect(registered_issue_ids).toContain('ISSUE-001');
    expect(registered_issue_ids).toContain('ISSUE-002');
    expect(registered_issue_ids).toContain('ISSUE-003');
    expect(registered_issue_ids).toContain('ISSUE-004');
    expect(registered_issue_ids).toContain('ISSUE-005');

    result.validatedIssues.forEach((issue: any) => {
      expect(issue.issueId).toBeDefined();
      expect(issue.priorityScore).toBeDefined();
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(issue.priorityRank);
      expect(issue.category).toBeDefined();
      expect(typeof issue.category).toBe('string');
      expect(issue.toolIssueId).toBeDefined();
      expect(typeof issue.toolIssueId).toBe('string');
      expect(issue.validationStatus).toBe('valid');
    });

    const issue_001 = result.validatedIssues.find((i: any) => i.issueId === 'ISSUE-001');
    expect(issue_001?.priorityScore).toBe(89);
    expect(issue_001?.priorityRank).toBe('high');
    expect(issue_001?.toolIssueId).toBe('PROJ-1001');

    const issue_003 = result.validatedIssues.find((i: any) => i.issueId === 'ISSUE-003');
    expect(issue_003?.priorityScore).toBe(60);
    expect(issue_003?.priorityRank).toBe('medium');
    expect(issue_003?.category).toBe('security');

    const issue_005 = result.validatedIssues.find((i: any) => i.issueId === 'ISSUE-005');
    expect(issue_005?.priorityScore).toBe(36);
    expect(issue_005?.priorityRank).toBe('low');
    expect(issue_005?.toolIssueId).toBe('PROJ-1005');

    expect(result.integrationResult).toBeDefined();
    expect(result.integrationResult.successCount).toBe(5);
    expect(result.integrationResult.failureCount).toBe(0);

    expect(result.executionSummary).toBeDefined();
    expect(result.executionSummary.status).toBe('success');
    expect(result.executionSummary.totalProcessed).toBe(5);
    expect(result.executionSummary.totalRegistered).toBe(5);
  });
});