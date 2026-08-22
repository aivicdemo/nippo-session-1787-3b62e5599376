import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as action01Module from '../../src/agents/tx-3-imp-1/prompts/action-01';
import * as action02Module from '../../src/agents/tx-3-imp-1/prompts/action-02';
import * as action03Module from '../../src/agents/tx-3-imp-1/prompts/action-03';
import * as action04Module from '../../src/agents/tx-3-imp-1/prompts/action-04';
import * as action05Module from '../../src/agents/tx-3-imp-1/prompts/action-05';

describe('Tx3Imp1Agent - Normal Case Workflow', () => {
  // SCEN-057: [normal] 日報集約から優先度別課題一覧提示までの自動判定・配信 AIエージェント
  test('should complete end-to-end issue prioritization and email delivery for normal aggregated reports without manual review', async () => {
    // Setup: Mock aggregated report data with 3 normal issues
    const aggregatedReportId = 'agg_20240115_001';
    const analysisExecutionTime = new Date('2024-01-15T08:00:00Z');
    const managerEmail = 'manager@example.com';
    const priorityThresholds = {
      highPriorityMinScore: 75,
      mediumPriorityMinScore: 50,
    };

    // Mock aggregated reports containing 3 normal issues
    const mockAggregatedReports = [
      {
        reportId: 'rpt_001',
        content: 'データベース接続タイムアウトが発生し、朝9時から30分間サービス利用不可',
        team: 'Engineering',
        submittedAt: '2024-01-15T07:00:00Z',
      },
      {
        reportId: 'rpt_002',
        content: 'APIレスポンスタイムが3秒を超過している。キャッシュヒット率の向上が必要',
        team: 'Backend',
        submittedAt: '2024-01-15T07:15:00Z',
      },
      {
        reportId: 'rpt_003',
        content: 'テストカバレッジが60%に低下。新規機能開発時のテストコード品質が低い',
        team: 'QA',
        submittedAt: '2024-01-15T07:30:00Z',
      },
    ];

    // Track prompt builder calls
    let action01PromptBuilt = false;
    let action02PromptBuilt = false;
    let action03PromptBuilt = false;
    let action04PromptBuilt = false;
    let action05PromptBuilt = false;

    // Track action execution order
    const executionOrder: string[] = [];

    // Mock AI Client implementation
    const mockAiClient: Tx3Imp1AiClient = {
      async executeAction01(prompt: string): Promise<{ keywords: Array<{ keyword: string; frequency: number; impactScore: number }> }> {
        action01PromptBuilt = true;
        executionOrder.push('action_01');
        expect(prompt).toBeTruthy();
        return {
          keywords: [
            { keyword: 'システム障害', frequency: 1, impactScore: 85 },
            { keyword: 'パフォーマンス低下', frequency: 1, impactScore: 70 },
            { keyword: 'テスト品質', frequency: 1, impactScore: 60 },
          ],
        };
      },

      async executeAction02(prompt: string): Promise<{ categories: Array<{ keyword: string; category: string; categoryDescription: string }> }> {
        action02PromptBuilt = true;
        executionOrder.push('action_02');
        expect(prompt).toBeTruthy();
        return {
          categories: [
            { keyword: 'システム障害', category: 'System Failure', categoryDescription: 'Critical infrastructure failure' },
            { keyword: 'パフォーマンス低下', category: 'Performance', categoryDescription: 'System performance degradation' },
            { keyword: 'テスト品質', category: 'Quality', categoryDescription: 'Test coverage and quality issues' },
          ],
        };
      },

      async executeAction03(prompt: string): Promise<{ prioritizedIssues: Array<{ keyword: string; priority: 'high' | 'medium' | 'low'; priorityScore: number; rationale: string }> }> {
        action03PromptBuilt = true;
        executionOrder.push('action_03');
        expect(prompt).toBeTruthy();
        return {
          prioritizedIssues: [
            { keyword: 'システム障害', priority: 'high', priorityScore: 85, rationale: '全ユーザーに影響、即座の対応が必須' },
            { keyword: 'パフォーマンス低下', priority: 'medium', priorityScore: 70, rationale: 'ユーザー体験に影響、24時間以内の対応推奨' },
            { keyword: 'テスト品質', priority: 'medium', priorityScore: 60, rationale: '長期的なリスク、今週中の対応' },
          ],
        };
      },

      async executeAction04(prompt: string): Promise<{ prioritizedList: { high: Array<{ keyword: string; frequency: number; priorityScore: number }>; medium: Array<{ keyword: string; frequency: number; priorityScore: number }>; low: Array<{ keyword: string; frequency: number; priorityScore: number }> } }> {
        action04PromptBuilt = true;
        executionOrder.push('action_04');
        expect(prompt).toBeTruthy();
        return {
          prioritizedList: {
            high: [{ keyword: 'システム障害', frequency: 1, priorityScore: 85 }],
            medium: [
              { keyword: 'パフォーマンス低下', frequency: 1, priorityScore: 70 },
              { keyword: 'テスト品質', frequency: 1, priorityScore: 60 },
            ],
            low: [],
          },
        };
      },

      async executeAction05(prompt: string): Promise<{ sendStatus: 'sent' | 'failed'; deliveredAt: string; recipientEmail: string; messageId: string }> {
        action05PromptBuilt = true;
        executionOrder.push('action_05');
        expect(prompt).toBeTruthy();
        expect(prompt).toContain(managerEmail);
        return {
          sendStatus: 'sent',
          deliveredAt: '2024-01-15T08:05:00Z',
          recipientEmail: managerEmail,
          messageId: 'msg_20240115_001',
        };
      },
    };

    // Spy on prompt builder functions to verify they are called
    jest.spyOn(action01Module, 'buildAction01Prompt');
    jest.spyOn(action02Module, 'buildAction02Prompt');
    jest.spyOn(action03Module, 'buildAction03Prompt');
    jest.spyOn(action04Module, 'buildAction04Prompt');
    jest.spyOn(action05Module, 'buildAction05Prompt');

    // Execute agent
    const result = await runTx3Imp1Agent(
      {
        reportAggregationId: aggregatedReportId,
        analysisExecutionTime,
        managerEmail,
        priorityThresholds,
      },
      mockAiClient,
    );

    // Verify execution order: all actions executed in sequence
    expect(executionOrder).toEqual(['action_01', 'action_02', 'action_03', 'action_04', 'action_05']);

    // Verify all prompt builders were called
    expect(action01Module.buildAction01Prompt).toHaveBeenCalled();
    expect(action02Module.buildAction02Prompt).toHaveBeenCalled();
    expect(action03Module.buildAction03Prompt).toHaveBeenCalled();
    expect(action04Module.buildAction04Prompt).toHaveBeenCalled();
    expect(action05Module.buildAction05Prompt).toHaveBeenCalled();

    // Verify all mock AI client methods were invoked
    expect(action01PromptBuilt).toBe(true);
    expect(action02PromptBuilt).toBe(true);
    expect(action03PromptBuilt).toBe(true);
    expect(action04PromptBuilt).toBe(true);
    expect(action05PromptBuilt).toBe(true);

    // Verify result structure and content
    expect(result).toBeDefined();
    expect(result.extractedIssues).toBeDefined();
    expect(result.extractedIssues).toHaveLength(3);
    expect(result.extractedIssues[0].keyword).toBe('システム障害');
    expect(result.extractedIssues[1].keyword).toBe('パフォーマンス低下');
    expect(result.extractedIssues[2].keyword).toBe('テスト品質');

    // Verify prioritized issue list structure
    expect(result.prioritizedIssueList).toBeDefined();
    expect(result.prioritizedIssueList).toHaveLength(3);

    // Verify high priority issue
    const highPriorityIssue = result.prioritizedIssueList.find((i) => i.priority === 'high');
    expect(highPriorityIssue).toBeDefined();
    expect(highPriorityIssue?.keyword).toBe('システム障害');
    expect(highPriorityIssue?.priorityScore).toBe(85);

    // Verify medium priority issues
    const mediumPriorityIssues = result.prioritizedIssueList.filter((i) => i.priority === 'medium');
    expect(mediumPriorityIssues).toHaveLength(2);
    expect(mediumPriorityIssues[0].keyword).toBe('パフォーマンス低下');
    expect(mediumPriorityIssues[0].priorityScore).toBe(70);
    expect(mediumPriorityIssues[1].keyword).toBe('テスト品質');
    expect(mediumPriorityIssues[1].priorityScore).toBe(60);

    // Verify email send status
    expect(result.emailSendStatus).toBeDefined();
    expect(result.emailSendStatus.sendStatus).toBe('sent');
    expect(result.emailSendStatus.recipientEmail).toBe(managerEmail);
    expect(result.emailSendStatus.deliveredAt).toBe('2024-01-15T08:05:00Z');
    expect(result.emailSendStatus.messageId).toBe('msg_20240115_001');

    // Verify execution timestamp
    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toBeInstanceOf(Date);

    // Verify processed issue count in audit info
    expect(result.auditInfo).toBeDefined();
    expect(result.auditInfo.processedIssueCount).toBe(3);
    expect(result.auditInfo.allActionsCompleted).toBe(true);

    // Restore spies
    jest.restoreAllMocks();
  });
});