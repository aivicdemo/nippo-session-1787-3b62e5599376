import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/types';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/ai-client';

describe('tx-3-imp-1: 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  test('SCEN-3121: エスカレーション - 経営層への報告が必要な重大課題の場合、副作用確定前に人へ引き継ぐ', async () => {
    // ============================================================
    // Setup: 集約済み日報データを準備 - 複数部門にまたがる重大課題を含む
    // ============================================================
    const aggregatedReportIds = [
      'report_2024_01_15_001',
      'report_2024_01_15_002',
      'report_2024_01_15_003',
    ];

    const input: Tx3Imp1AgentInput = {
      aggregatedReportIds,
      analysisStartDate: '2024-01-15T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      managerUserId: 'user_manager_001',
      priorityThresholdScore: 70,
    };

    const escalationLogs: Array<{
      issueId: string;
      reason: string;
      timestamp: string;
      managerUserId: string;
    }> = [];

    const mailSendAttempts: Array<{
      timestamp: string;
      recipientId: string;
    }> = [];

    const aiClientStub: Tx3Imp1AiClient = {
      // Action 1: 課題キーワード抽出
      extractKeywords: async () => ({
        keywords: [
          {
            keyword: 'システム全体の本番障害',
            frequency: 3,
            affectedDepartments: [
              'engineering',
              'operations',
              'sales',
              'marketing',
            ],
          },
          { keyword: 'データベース接続失敗', frequency: 2, affectedDepartments: ['engineering', 'operations'] },
          { keyword: '顧客への影響', frequency: 3, affectedDepartments: ['sales'] },
        ],
      }),

      // Action 2: 課題カテゴリ分類
      classifyIssueCategory: async (keyword) => {
        if (keyword === 'システム全体の本番障害') {
          return { category: 'critical_incident', confidence: 0.95 };
        }
        if (keyword === 'データベース接続失敗') {
          return { category: 'infrastructure', confidence: 0.87 };
        }
        if (keyword === '顧客への影響') {
          return { category: 'customer_impact', confidence: 0.92 };
        }
        return { category: 'other', confidence: 0.5 };
      },

      // Action 3: 優先度自動判定 - 重大課題を生成
      assessPriorityScore: async (keyword) => {
        if (keyword === 'システム全体の本番障害') {
          return {
            priorityScore: 95,
            priorityRank: 'critical',
            isEscalationRequired: true,
            escalationReason: 'multiple_departments_affected_with_service_downtime',
          };
        }
        if (keyword === 'データベース接続失敗') {
          return {
            priorityScore: 82,
            priorityRank: 'high',
            isEscalationRequired: false,
            escalationReason: null,
          };
        }
        if (keyword === '顧客への影響') {
          return {
            priorityScore: 88,
            priorityRank: 'high',
            isEscalationRequired: false,
            escalationReason: null,
          };
        }
        return {
          priorityScore: 40,
          priorityRank: 'low',
          isEscalationRequired: false,
          escalationReason: null,
        };
      },

      // Action 4: 優先度別課題一覧生成（スキップされることを検証）
      generatePrioritizedIssuesList: async () => {
        throw new Error('This should not be called during escalation flow');
      },

      // Action 5: 確認メール送信（スキップされることを検証）
      sendConfirmationEmail: async (recipientId) => {
        mailSendAttempts.push({
          timestamp: new Date().toISOString(),
          recipientId,
        });
        return { status: 'sent', messageId: 'msg_12345' };
      },

      // エスカレーション処理: 人への引き継ぎ
      handoffToManager: async (issue, reason, timestamp) => {
        escalationLogs.push({
          issueId: issue.id,
          reason,
          timestamp,
          managerUserId: input.managerUserId,
        });
        return {
          handoffId: `handoff_${Date.now()}`,
          status: 'transferred_to_manager',
          managerUserId: input.managerUserId,
          transferredAt: timestamp,
        };
      },
    };

    // ============================================================
    // Execution: runTx3Imp1Agentを実行
    // ============================================================
    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, aiClientStub);

    // ============================================================
    // Assertion 1: エスカレーション検出の確認
    // ============================================================
    expect(output.executionId).toBeDefined();
    expect(output.executionId).toMatch(/^tx3_imp1_/);

    // ============================================================
    // Assertion 2: 抽出課題の確認
    // ============================================================
    expect(output.extractedIssuesCount).toBe(3);

    // ============================================================
    // Assertion 3: 優先度付き課題リストの確認
    // ============================================================
    expect(output.prioritizedIssuesList).toBeDefined();
    expect(output.prioritizedIssuesList.length).toBeGreaterThan(0);

    const criticalIssue = output.prioritizedIssuesList.find(
      (issue) => issue.priorityRank === 'critical'
    );
    expect(criticalIssue).toBeDefined();
    expect(criticalIssue?.priorityScore).toBe(95);
    expect(criticalIssue?.isEscalationRequired).toBe(true);
    expect(criticalIssue?.escalationReason).toBe(
      'multiple_departments_affected_with_service_downtime'
    );

    // ============================================================
    // Assertion 4: エスカレーション処理の実行確認
    // ============================================================
    expect(escalationLogs.length).toBe(1);
    expect(escalationLogs[0].issueId).toBe(criticalIssue?.id);
    expect(escalationLogs[0].reason).toBe(
      'multiple_departments_affected_with_service_downtime'
    );
    expect(escalationLogs[0].managerUserId).toBe('user_manager_001');
    expect(escalationLogs[0].timestamp).toBeDefined();

    // ============================================================
    // Assertion 5: メール送信がスキップされたことの確認
    // ============================================================
    expect(mailSendAttempts.length).toBe(0);

    // ============================================================
    // Assertion 6: メール送信ステータスがスキップを示すことの確認
    // ============================================================
    expect(output.emailSendStatus).toBe('pending');

    // ============================================================
    // Assertion 7: 完了タイムスタンプの確認
    // ============================================================
    expect(output.completionTimestamp).toBeDefined();
    const completionDate = new Date(output.completionTimestamp);
    expect(completionDate.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );

    // ============================================================
    // Assertion 8: 優先度スコアの順序確認
    // ============================================================
    for (let i = 0; i < output.prioritizedIssuesList.length - 1; i++) {
      expect(output.prioritizedIssuesList[i].priorityScore).toBeGreaterThanOrEqual(
        output.prioritizedIssuesList[i + 1].priorityScore
      );
    }

    // ============================================================
    // Assertion 9: エスカレーション対象のみが人確認待ちであること
    // ============================================================
    const escalatedIssues = output.prioritizedIssuesList.filter(
      (issue) => issue.isEscalationRequired
    );
    expect(escalatedIssues.length).toBe(1);
    expect(escalatedIssues[0].priorityScore).toBe(95);
  });
});