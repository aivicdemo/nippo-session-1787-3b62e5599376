import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/types';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行 - エスカレーション処理', () => {
  // SCEN-3105: 複数課題の関連性判定が不確実な場合、メール配信前に部長へエスカレーション通知を送信する

  let escalationNotificationSent: boolean = false;
  let escalationNotificationContent: {
    managerId: string;
    issues: Array<{
      keyword: string;
      confidenceScore: number;
      impactScore: number;
    }>;
    message: string;
  } | null = null;

  let emailDeliveryPending: boolean = false;
  let confirmationEmailSent: boolean = false;

  beforeEach(() => {
    escalationNotificationSent = false;
    escalationNotificationContent = null;
    emailDeliveryPending = false;
    confirmationEmailSent = false;
  });

  afterEach(() => {
    escalationNotificationSent = false;
    escalationNotificationContent = null;
    emailDeliveryPending = false;
    confirmationEmailSent = false;
  });

  test('should escalate to manager when multiple issue correlation is uncertain before sending confirmation email', async () => {
    // Input: 複数の日報から課題を抽出済みの状態
    const input: Tx2Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      targetTeamIds: ['team-001', 'team-002'],
      managerUserIds: ['manager-001'],
    };

    // Stub: TextAnalysisServiceAdapter - 課題A・Bの関連性判定を不確実に設定
    const aiClient: Tx2Imp1AiClient = {
      extractKeywords: async (reportText: string) => {
        if (reportText.includes('database') || reportText.includes('connection')) {
          return [
            { keyword: 'データベース接続エラー', frequency: 3, confidenceScore: 0.92 },
          ];
        }
        if (reportText.includes('API') || reportText.includes('response')) {
          return [
            { keyword: 'APIレスポンス遅延', frequency: 3, confidenceScore: 0.88 },
          ];
        }
        return [];
      },
      assessImpactScore: async (keyword: string) => {
        // 関連性判定が不確実（信頼度 0.45 < 閾値 0.7）
        if (keyword === 'データベース接続エラー' || keyword === 'APIレスポンス遅延') {
          return {
            impactScore: 65,
            correlationWithOtherIssues: 0.45, // 閾値未満
            relatedKeywords: ['データベース接続エラー', 'APIレスポンス遅延'],
          };
        }
        return { impactScore: 50, correlationWithOtherIssues: 0.0, relatedKeywords: [] };
      },
      classifyIssueSeverity: async (issueText: string) => {
        return 'high';
      },
      sendEscalationNotification: async (managerId: string, escalationData: any) => {
        escalationNotificationSent = true;
        escalationNotificationContent = {
          managerId,
          issues: escalationData.issues || [],
          message: escalationData.message || '',
        };
        emailDeliveryPending = true;
        return { success: true, notificationId: 'esc-001' };
      },
      generateConfirmationEmail: async (emailData: any) => {
        if (emailDeliveryPending) {
          return {
            success: false,
            reason: 'Pending escalation approval from manager',
            emailId: null,
          };
        }
        confirmationEmailSent = true;
        return { success: true, emailId: 'email-001' };
      },
      sendConfirmationEmail: async (managerId: string, emailContent: string) => {
        if (emailDeliveryPending) {
          return { success: false, reason: 'Pending escalation approval' };
        }
        return { success: true, emailId: 'email-002' };
      },
    };

    // 集約済み日報データ（複数チームメンバーから報告）
    const aggregatedReportData = {
      submittedMembersCount: 8,
      unsubmittedMembersCount: 2,
      reportDataList: [
        {
          memberId: 'member-001',
          teamId: 'team-001',
          reportDate: new Date('2024-01-15'),
          challenges:
            'We encountered database connection errors in production environment and API response delays',
        },
        {
          memberId: 'member-002',
          teamId: 'team-001',
          reportDate: new Date('2024-01-15'),
          challenges:
            'Database connectivity issues are causing system instability. API calls timing out.',
        },
        {
          memberId: 'member-003',
          teamId: 'team-002',
          reportDate: new Date('2024-01-15'),
          challenges: 'Database connection pool exhaustion. Slow API responses.',
        },
      ],
    };

    // Action 3・4を実行：課題抽出と優先度付け（エスカレーション条件発生）
    const output: Tx2Imp1AgentOutput = await runTx2Imp1Agent(input, aiClient);

    // 検証 1: エスカレーション通知が送信されたことを確認
    expect(escalationNotificationSent).toBe(true);

    // 検証 2: エスカレーション通知に関連性が不確実な課題A・Bの詳細が含まれていることを確認
    expect(escalationNotificationContent).not.toBeNull();
    expect(escalationNotificationContent?.managerId).toBe('manager-001');
    expect(escalationNotificationContent?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: expect.stringMatching(/データベース接続エラー|APIレスポンス遅延/),
          confidenceScore: expect.any(Number),
          impactScore: expect.any(Number),
        }),
      ])
    );
    expect(escalationNotificationContent?.message).toMatch(/関連性判定/);

    // 検証 3: 副作用（メール配信）が確定される前に、エスカレーション処理が実行されたことを確認
    expect(emailDeliveryPending).toBe(true);
    expect(confirmationEmailSent).toBe(false);

    // 検証 4: aggregatedReportCount と extractedIssueCount が正しく計算されていることを確認
    expect(output.aggregatedReportCount).toBe(8);
    expect(output.extractedIssueCount).toBeGreaterThan(0);

    // 検証 5: 部長への確認メール送信フラグが false（ペンディング状態）であることを確認
    expect(output.confirmationEmailSent).toBe(false);

    // 検証 6: prioritizedIssues に関連性不確実な課題が含まれていることを確認
    expect(output.prioritizedIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: expect.stringMatching(/データベース接続エラー|APIレスポンス遅延/),
        }),
      ])
    );

    // 検証 7: システムが待機状態を保っていることを確認
    // （emailDeliveryPending が true のため、次のメール送信は抑止されるはず）
    expect(emailDeliveryPending).toBe(true);
    expect(confirmationEmailSent).toBe(false);
  });
});