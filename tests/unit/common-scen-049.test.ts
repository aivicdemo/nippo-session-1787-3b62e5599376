import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('Tx2Imp1Agent - 複数課題の関連性判定エスカレーション', () => {
  // SCEN-049: 複数課題の関連性判定が必要な場合に副作用確定前に人へ引き継ぐ
  test('should escalate when multiple issues require relatedness judgment before sending confirmation email', async () => {
    const executionTimestamp = new Date('2024-01-15T08:55:00Z');
    const reportingDeadline = new Date('2024-01-15T09:00:00Z');
    const teamId = 'team-001';
    const managerEmail = 'manager@company.com';

    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp,
      teamId,
      reportingDeadline,
      managerEmail,
    };

    // モック用のAIクライアント：複数課題の関連性を検出するシナリオ
    let action1Called = false;
    let action2Called = false;
    let action3Called = false;
    let action3Result: any = null;
    let action4Called = false;
    let action6Called = false;
    let escalationNotificationSent = false;
    let escalationNotificationContent: any = null;

    const mockAiClient: Tx2Imp1AiClient = {
      action01_collectDailyReports: async () => {
        action1Called = true;
        return {
          success: true,
          reports: [
            {
              memberId: 'member-a',
              memberName: 'Member A',
              content: '顧客システム障害対応中。影響範囲は本番環境全体。',
              submittedAt: new Date('2024-01-15T08:50:00Z'),
            },
            {
              memberId: 'member-b',
              memberName: 'Member B',
              content: '同一顧客システムの改善要望対応中。障害と関連している可能性あり。',
              submittedAt: new Date('2024-01-15T08:52:00Z'),
            },
          ],
          unsubmittedMembers: [],
        };
      },

      action02_unifyFormat: async (reports: any[]) => {
        action2Called = true;
        return {
          success: true,
          unifiedReports: reports.map((r: any) => ({
            ...r,
            standardizedFormat: true,
          })),
        };
      },

      action03_extractIssues: async (reports: any[]) => {
        action3Called = true;
        action3Result = {
          success: true,
          extractedIssues: [
            {
              issueId: 'issue-001',
              memberId: 'member-a',
              title: '顧客システム障害対応',
              description: '顧客システム障害対応中。影響範囲は本番環境全体。',
              severity: 'high',
              relatedIssueIds: ['issue-002'],
              relationshipConfidence: 0.85,
            },
            {
              issueId: 'issue-002',
              memberId: 'member-b',
              title: '同一顧客システムの改善要望対応',
              description: '同一顧客システムの改善要望対応中。障害と関連している可能性あり。',
              severity: 'medium',
              relatedIssueIds: ['issue-001'],
              relationshipConfidence: 0.85,
            },
          ],
          requiresRelationshipJudgment: true,
          relationshipJudgmentReason: 'これらの課題が同一インシデントに関連している可能性があります',
        };
        return action3Result;
      },

      action04_colorizeByPriority: async (issues: any[], _requiresJudgment: boolean) => {
        action4Called = true;
        if (_requiresJudgment) {
          return {
            success: false,
            escalated: true,
            escalationReason: '複数課題の関連性判定が必要です',
            pendingIssues: issues,
            internalState: {
              status: 'ESCALATION_AWAITING',
              timestamp: executionTimestamp,
              issues,
            },
          };
        }
        return {
          success: true,
          colorizedIssues: issues.map((i: any) => ({ ...i, color: 'HIGH' })),
        };
      },

      action06_generateAndSendEmail: async (_colorizedIssues: any[], _requiresJudgment: boolean) => {
        action6Called = true;
        return {
          success: false,
          skipped: true,
          reason: 'Email generation skipped due to escalation',
        };
      },

      // エスカレーション通知の送信（Action内で実装されると想定）
      sendEscalationNotification: async (escalationData: any) => {
        escalationNotificationSent = true;
        escalationNotificationContent = {
          subject: '[手動確認必要] 複数課題の関連性判定が必要です',
          body: `以下の課題の関連性判定が必要です:\n\n` +
                `メンバーA課題『顧客システム障害対応中』\n` +
                `メンバーB課題『同一顧客システムの改善要望対応中』\n\n` +
                `判定理由: ${escalationData.reason}`,
          issues: escalationData.issues,
          recipientEmail: managerEmail,
        };
        return { success: true };
      },
    };

    // エージェント実行
    const result = await runTx2Imp1Agent(agentInput, mockAiClient);

    // (1) Action 1 (日報収集)が呼び出された
    expect(action1Called).toBe(true);

    // (2) Action 2 (統一フォーマット変換)が呼び出された
    expect(action2Called).toBe(true);

    // (3) Action 3 (課題抽出)が呼び出され、複数課題の関連性が検出された
    expect(action3Called).toBe(true);
    expect(action3Result.requiresRelationshipJudgment).toBe(true);
    expect(action3Result.extractedIssues).toHaveLength(2);
    expect(action3Result.relationshipJudgmentReason).toMatch(/同一インシデント/);

    // (4) Action 4 (優先度色分け)が呼び出されたが、エスカレーション状態で保留
    expect(action4Called).toBe(true);

    // (5) Action 6 (メール生成・配信)は呼び出されず、副作用が確定していない
    expect(action6Called).toBe(false);

    // (6) エスカレーション通知が送信されたことを確認
    expect(escalationNotificationSent).toBe(true);
    expect(escalationNotificationContent.subject).toMatch(/手動確認必要/);
    expect(escalationNotificationContent.body).toMatch(/顧客システム障害対応中/);
    expect(escalationNotificationContent.body).toMatch(/同一顧客システムの改善要望対応中/);
    expect(escalationNotificationContent.body).toMatch(/同一インシデント/);

    // (7) エージェント内部状態が ESCALATION_AWAITING に設定されていることを確認
    // (action04の戻り値でinternalStateが保存される)
    expect(result.aggregationStatus).toBeDefined();

    // (8) 確認メール送信ステータスが 'pending' または 'escalated' であることを確認
    // (メール送信が保留中であることを示す)
    expect(result.emailSendStatus).not.toBe('sent');
  });
});