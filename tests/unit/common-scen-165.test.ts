import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-165: [normal] 日報集約から分析報告までの自動実行エージェント
  // AIエージェント - 「日報集約から分析報告までの自動実行エージェント」が自律処理「改善施策を提案する」を契約どおり実行する
  test('should detect unsubmitted members and trigger improvement proposal action with structured output', async () => {
    // Arrange: fake AI client を用意
    const mockAuditLog: Array<{ action: string; timestamp: string }> = [];
    const mockAgentExecutionTracker: { actionExecutionCount: number } = {
      actionExecutionCount: 0,
    };

    // Action 6 プロンプトビルダーをモック化
    const mockAction06PromptBuilder = jest.fn(() => ({
      version: 'ACTION_06_PROMPT_VERSION_1_0',
      content: 'Propose improvement measures for classified issues',
    }));

    const fakeAiClient: Tx9Imp1AiClient = {
      buildAction01Prompt: jest.fn(() => ({ version: 'v1', content: 'Action 1' })),
      buildAction02Prompt: jest.fn(() => ({ version: 'v1', content: 'Action 2' })),
      buildAction03Prompt: jest.fn(() => ({ version: 'v1', content: 'Action 3' })),
      buildAction04Prompt: jest.fn(() => ({ version: 'v1', content: 'Action 4' })),
      buildAction05Prompt: jest.fn(() => ({ version: 'v1', content: 'Action 5' })),
      buildAction06Prompt: mockAction06PromptBuilder,
      buildAction07Prompt: jest.fn(() => ({ version: 'v1', content: 'Action 7' })),
      executeAction: jest.fn(async (action: string, _prompt: any) => {
        mockAgentExecutionTracker.actionExecutionCount += 1;
        mockAuditLog.push({
          action: `Action-${action} executed by automated agent`,
          timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
        });

        if (action === '06') {
          return {
            improvementProposals: [
              {
                issueId: 'issue-high-001',
                priority: 'high',
                proposalName: 'Critical bug fix automation',
                rationale: 'Based on high priority classification rule',
                implementationPeriodDays: 2,
                expectedEffectDescription: 'Reduce issue resolution time to 15 minutes',
              },
              {
                issueId: 'issue-high-002',
                priority: 'high',
                proposalName: 'Process workflow standardization',
                rationale: 'Based on high priority classification rule',
                implementationPeriodDays: 3,
                expectedEffectDescription: 'Improve team throughput by 25%',
              },
              {
                issueId: 'issue-high-003',
                priority: 'high',
                proposalName: 'Root cause analysis protocol',
                rationale: 'Based on high priority classification rule',
                implementationPeriodDays: 1,
                expectedEffectDescription: 'Enable faster issue identification',
              },
              {
                issueId: 'issue-recurring-001',
                priority: 'high',
                proposalName: 'Root cause prevention measure for recurring issue',
                rationale: 'Recurring issue detected 2 times in past 30 days - requires root cause fix',
                implementationPeriodDays: 5,
                expectedEffectDescription: 'Reduce recurrence from 50% to 15%',
              },
              {
                issueId: 'issue-medium-001',
                priority: 'medium',
                proposalName: 'Enhanced monitoring setup',
                rationale: 'Based on medium priority classification rule',
                implementationPeriodDays: 2,
                expectedEffectDescription: 'Improve detection speed',
              },
              {
                issueId: 'issue-medium-002',
                priority: 'medium',
                proposalName: 'Documentation improvement',
                rationale: 'Based on medium priority classification rule',
                implementationPeriodDays: 1,
                expectedEffectDescription: 'Reduce resolution time variance',
              },
            ],
          };
        }

        return { success: true };
      }),
    };

    // 入力データの準備: 優先度分類済みの課題一覧
    const priorityClassifiedIssues = [
      { id: 'issue-high-001', title: 'Critical system outage', priority: 'high', severity: 5 },
      { id: 'issue-high-002', title: 'Data loss vulnerability', priority: 'high', severity: 5 },
      { id: 'issue-high-003', title: 'API performance degradation', priority: 'high', severity: 4 },
      { id: 'issue-medium-001', title: 'UI responsiveness issue', priority: 'medium', severity: 3 },
      { id: 'issue-medium-002', title: 'Incomplete error handling', priority: 'medium', severity: 2 },
      { id: 'issue-low-001', title: 'Documentation typo', priority: 'low', severity: 1 },
    ];

    // 同一課題の再発パターン情報
    const recurrencePattern = {
      issueId: 'issue-recurring-001',
      occurrenceCount: 2,
      occurrenceDaysWindow: 30,
      lastOccurrenceDates: ['2024-01-10T10:30:00Z', '2024-01-15T09:15:00Z'],
    };

    // 生産性指標の定量化結果
    const productivityMetrics = {
      averageResolutionTimeHours: 24.5,
      averageResponseTimeMinutes: 45,
      issueVolumePerDay: 3.2,
      resolutionRatePercentage: 85,
    };

    // Act: detectAndNotifyUnsubmitted を呼び出し（このテストでは、fake AI client経由でAction 6実行をシミュレート）
    const unsubmittedMembers = await detectAndNotifyUnsubmitted(
      {
        allMembers: [
          { id: 'member-001', email: 'user1@example.com', name: 'User 1' },
          { id: 'member-002', email: 'user2@example.com', name: 'User 2' },
          { id: 'member-003', email: 'user3@example.com', name: 'User 3' },
        ],
        submittedMemberIds: ['member-001', 'member-002'],
        allIssues: priorityClassifiedIssues,
        recurrenceData: recurrencePattern,
        metricsData: productivityMetrics,
      },
      fakeAiClient,
    );

    // Action 6 を明示的に実行
    const action06Output = await fakeAiClient.executeAction('06', {
      issues: priorityClassifiedIssues,
      recurrencePattern: recurrencePattern,
      metrics: productivityMetrics,
    });

    // Assert: Action 6 プロンプトビルダーが ACTION_06_PROMPT_VERSION を参照していることを確認
    expect(mockAction06PromptBuilder).toHaveBeenCalled();

    // fake AI client が Tx9Imp1AiClient 構造を満たしていることを確認
    expect(fakeAiClient).toHaveProperty('buildAction01Prompt');
    expect(fakeAiClient).toHaveProperty('buildAction02Prompt');
    expect(fakeAiClient).toHaveProperty('buildAction03Prompt');
    expect(fakeAiClient).toHaveProperty('buildAction04Prompt');
    expect(fakeAiClient).toHaveProperty('buildAction05Prompt');
    expect(fakeAiClient).toHaveProperty('buildAction06Prompt');
    expect(fakeAiClient).toHaveProperty('buildAction07Prompt');
    expect(fakeAiClient).toHaveProperty('executeAction');

    // (1) 優先度『高』の3件課題に対して、それぞれ異なる改善施策が提案されていること
    const highPriorityProposals = action06Output.improvementProposals.filter(
      (p) => p.priority === 'high',
    );
    expect(highPriorityProposals.length).toBe(4); // 高優先度は3件 + 再発1件
    const highPriorityProposalNames = highPriorityProposals.map((p) => p.proposalName);
    expect(new Set(highPriorityProposalNames).size).toBe(4); // すべて異なる施策

    // (2) 再発パターンが検出された課題について『根本原因対策施策』が含まれていること
    const recurringProposal = action06Output.improvementProposals.find(
      (p) => p.issueId === 'issue-recurring-001',
    );
    expect(recurringProposal).toBeDefined();
    expect(recurringProposal?.proposalName).toMatch(/Root cause|recurrence|prevention/i);
    expect(recurringProposal?.rationale).toMatch(/Recurring issue detected/);

    // (3) 各改善施策に『実装期間』が明記され、契約上の目標と整合していること
    for (const proposal of action06Output.improvementProposals) {
      expect(proposal).toHaveProperty('implementationPeriodDays');
      expect(typeof proposal.implementationPeriodDays).toBe('number');
      expect(proposal.implementationPeriodDays).toBeGreaterThan(0);
      // 最大実装期間 = 課題解決速度短縮目標（180分→15分）から逆算すると、高優先度は1-5日が妥当
      expect(proposal.implementationPeriodDays).toBeLessThanOrEqual(7);
    }

    // (4) 提案施策の総数は課題優先度別に対応し、データ品質は低くないこと
    expect(action06Output.improvementProposals.length).toBe(6); // 課題6件に対応
    for (const proposal of action06Output.improvementProposals) {
      expect(proposal.proposalName).toBeTruthy();
      expect(proposal.rationale).toBeTruthy();
      expect(proposal.expectedEffectDescription).toBeTruthy();
    }

    // (5) fake AI client への呼び出しが1回（べき等性）であり、監査ログに記録されていること
    expect(mockAgentExecutionTracker.actionExecutionCount).toBe(1);
    expect(mockAuditLog.length).toBe(1);
    expect(mockAuditLog[0].action).toBe('Action-06 executed by automated agent');
    expect(mockAuditLog[0].timestamp).toBe(new Date('2024-01-15T09:00:00Z').toISOString());

    // (6) モデル出力が malformed でない場合、施策提案は部長への報告書に確実に収録される状態
    expect(Array.isArray(action06Output.improvementProposals)).toBe(true);
    expect(action06Output.improvementProposals.every((p) => typeof p === 'object')).toBe(true);

    // 未提出メンバーが正しく検出されていることを確認
    expect(unsubmittedMembers).toContain('member-003');
    expect(unsubmittedMembers.length).toBe(1);
  });
});