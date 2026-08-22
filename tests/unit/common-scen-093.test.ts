import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-093: [normal] 課題抽出から既存ツール連携・確認までの自律実行 AIエージェント - 「課題抽出から既存ツール連携・確認までの自律実行」が自律処理「既存ツール連携設定を実行する」を契約どおり実行する
  test('should execute tool integration setup action as autonomous process without manual intervention', async () => {
    // Arrange: テスト環境にて、モック化されたJira・Asana APIクライアントを注入したTx5Imp1AiClientインスタンスを準備する
    const mockJiraClient = {
      createIssue: jest.fn().mockResolvedValue({
        id: 'PROJ-001',
        key: 'PROJ-001',
        self: 'https://jira.example.com/rest/api/3/issue/10000',
      }),
      linkIssue: jest.fn().mockResolvedValue({ id: 'PROJ-001' }),
    };

    const mockAsanaClient = {
      createTask: jest.fn().mockResolvedValue({
        data: {
          id: '1234567890',
          name: 'Test Issue Task',
          gid: '1234567890',
        },
      }),
      addCustomFields: jest.fn().mockResolvedValue({}),
    };

    const mockAiClient = {
      validateExtractedIssues: jest.fn().mockResolvedValue({
        isValid: true,
        issues: [
          {
            id: 'issue-001',
            title: 'Database connection timeout',
            description: 'Connection timeout occurs frequently',
            priority: 'HIGH',
            category: 'INFRASTRUCTURE',
            recurrenceRisk: 0.75,
          },
        ],
      }),
      determinePriorityAndCategory: jest.fn().mockResolvedValue({
        priority: 'HIGH',
        category: 'INFRASTRUCTURE',
        confidence: 0.92,
      }),
      planToolIntegrationSetup: jest.fn().mockResolvedValue({
        jiraConfig: {
          projectKey: 'PROJ',
          issueType: 'Bug',
          priority: 'High',
          labels: ['infrastructure', 'critical'],
        },
        asanaConfig: {
          projectId: 'project-123',
          taskName: 'Database connection timeout',
          priority: 'HIGH',
          customFields: { category: 'INFRASTRUCTURE' },
        },
      }),
      executeToolIntegrationSetup: jest.fn().mockResolvedValue({
        jiraResult: { issueId: 'PROJ-001', status: 'created' },
        asanaResult: { taskId: '1234567890', status: 'created' },
      }),
      recordAndNotifyCompletionStatus: jest.fn().mockResolvedValue({
        status: 'linked',
        timestamp: '2024-01-15T08:00:00Z',
        linkedCount: 2,
      }),
    };

    const extractedIssuesData = [
      {
        id: 'issue-001',
        title: 'Database connection timeout',
        description: 'Connection timeout occurs frequently',
        priority: 'HIGH',
        category: 'INFRASTRUCTURE',
        recurrenceRisk: 0.75,
      },
    ];

    const testContext = {
      timestamp: '2024-01-15T08:00:00Z',
      userId: 'user-manager-001',
      sessionId: 'session-abc123',
      auditLog: [] as Array<{
        action: string;
        timestamp: string;
        promptVersion: string;
        result: Record<string, unknown>;
      }>,
    };

    // Act: runTx5Imp1Agentの第2パラメータとしてTx5Imp1AiClientが構造的に一致していることをassertで確認する
    expect(mockAiClient).toHaveProperty('validateExtractedIssues');
    expect(mockAiClient).toHaveProperty('determinePriorityAndCategory');
    expect(mockAiClient).toHaveProperty('planToolIntegrationSetup');
    expect(mockAiClient).toHaveProperty('executeToolIntegrationSetup');
    expect(mockAiClient).toHaveProperty('recordAndNotifyCompletionStatus');

    // 抽出済み課題データ（形式正常、優先度・カテゴリ判定済み、連携エラーなし）をオーケストレータへ入力する
    const result = await detectAndNotifyUnsubmitted({
      extractedIssues: extractedIssuesData,
      aiClient: mockAiClient,
      jiraClient: mockJiraClient,
      asanaClient: mockAsanaClient,
      context: testContext,
    });

    // Assert: オーケストレータが各アクションのプロンプトをロードしていることを確認する
    expect(mockAiClient.validateExtractedIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.determinePriorityAndCategory).toHaveBeenCalledTimes(1);
    expect(mockAiClient.planToolIntegrationSetup).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeToolIntegrationSetup).toHaveBeenCalledTimes(1);
    expect(mockAiClient.recordAndNotifyCompletionStatus).toHaveBeenCalledTimes(1);

    // AIクライアントが既存ツール連携設定実行アクション（Action 3に対応）をモックAIの応答として契約通りに実行することをspy/mockで検証する
    const executeToolIntegrationSetupCall = mockAiClient.executeToolIntegrationSetup.mock.calls[0];
    expect(executeToolIntegrationSetupCall).toBeDefined();
    expect(executeToolIntegrationSetupCall[0]).toHaveProperty('jiraConfig');
    expect(executeToolIntegrationSetupCall[0]).toHaveProperty('asanaConfig');

    // モックJira APIに対して、テスト課題データが正しい形式（課題ID、優先度レベル、カテゴリラベル）で登録リクエストが送信されたことをassertする
    expect(mockJiraClient.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({
          summary: expect.stringContaining('Database connection timeout'),
          priority: expect.objectContaining({ name: 'High' }),
          labels: expect.arrayContaining(['infrastructure', 'critical']),
        }),
      })
    );

    // モックAsana APIに対して、テスト課題データが正しい形式で登録リクエストが送信されたことをassertする
    expect(mockAsanaClient.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('Database connection timeout'),
        projects: ['project-123'],
      })
    );

    // 連携完了ステータスが記録・通知アクション（Action 5）によって適切に設定されたことを確認する
    expect(mockAiClient.recordAndNotifyCompletionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        jiraIssueId: 'PROJ-001',
        asanaTaskId: '1234567890',
      })
    );

    // オーケストレータの戻り値に以下の構造が含まれていることをassertする：{ success: true, linkedIssueIds: [...], linkedTaskIds: [...], timestamp: ISO8601形式, auditLog: [...] }
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);

    expect(result).toHaveProperty('linkedIssueIds');
    expect(Array.isArray(result.linkedIssueIds)).toBe(true);
    expect(result.linkedIssueIds).toContain('PROJ-001');

    expect(result).toHaveProperty('linkedTaskIds');
    expect(Array.isArray(result.linkedTaskIds)).toBe(true);
    expect(result.linkedTaskIds).toContain('1234567890');

    expect(result).toHaveProperty('timestamp');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.timestamp)).toBe(true);

    expect(result).toHaveProperty('auditLog');
    expect(Array.isArray(result.auditLog)).toBe(true);
    expect(result.auditLog.length).toBeGreaterThanOrEqual(5);

    // 監査ログには各アクション実行タイムスタンプ、使用プロンプトバージョン、登録結果が記録され、戻り値のsuccess フラグがtrueとなること
    const auditLogActions = result.auditLog.map((log: Record<string, unknown>) => log.action);
    expect(auditLogActions).toContain('VALIDATE_EXTRACTED_ISSUES');
    expect(auditLogActions).toContain('DETERMINE_PRIORITY_CATEGORY');
    expect(auditLogActions).toContain('PLAN_TOOL_INTEGRATION');
    expect(auditLogActions).toContain('EXECUTE_TOOL_INTEGRATION');
    expect(auditLogActions).toContain('RECORD_COMPLETION_STATUS');

    result.auditLog.forEach((log: Record<string, unknown>) => {
      expect(log).toHaveProperty('timestamp');
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(log.timestamp as string)).toBe(true);
      expect(log).toHaveProperty('promptVersion');
      expect(log).toHaveProperty('result');
    });

    // 外部APIへの実通信は行われず、すべてモックを経由することを確認
    expect(mockJiraClient.createIssue).toHaveBeenCalledTimes(1);
    expect(mockAsanaClient.createTask).toHaveBeenCalledTimes(1);
  });
});