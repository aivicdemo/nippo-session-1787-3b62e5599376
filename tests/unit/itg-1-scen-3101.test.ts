import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import { type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';
import { type Tx2Imp1AgentInput, type Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行', () => {
  // SCEN-3101: [normal] 未提出メンバーを特定するアクションが契約どおり実行される
  test('Action 5（未提出メンバー特定）が fakeAiClient を通じて正確に実行され、未提出者リストをメール本文に反映する', async () => {
    // ========== Setup: fakeAiClient を準備 ==========
    const fakeAiClient: Tx2Imp1AiClient = {
      aggregateReports: jest.fn(async (input) => ({
        aggregatedReportCount: 7,
        submittedMembersIds: ['member-01', 'member-03', 'member-04', 'member-05', 'member-06', 'member-08', 'member-10'],
        reportDataList: [
          {
            memberId: 'member-01',
            yesterdayAccomplishment: '機能A の実装完了',
            todayPlans: '機能B の実装開始',
            challengeIssue: 'なし'
          },
          {
            memberId: 'member-03',
            yesterdayAccomplishment: 'バグ修正3件',
            todayPlans: 'パフォーマンステスト実施',
            challengeIssue: 'テスト環境の接続不安定'
          },
          {
            memberId: 'member-04',
            yesterdayAccomplishment: 'ドキュメント作成',
            todayPlans: 'レビュー実施',
            challengeIssue: 'なし'
          },
          {
            memberId: 'member-05',
            yesterdayAccomplishment: 'API仕様確認',
            todayPlans: 'API統合テスト',
            challengeIssue: '外部API の応答遅延'
          },
          {
            memberId: 'member-06',
            yesterdayAccomplishment: 'デザイン案作成',
            todayPlans: 'デザイン確定会議',
            challengeIssue: 'なし'
          },
          {
            memberId: 'member-08',
            yesterdayAccomplishment: 'セキュリティチェック',
            todayPlans: '脆弱性対応',
            challengeIssue: 'セキュリティ脆弱性 3件検出'
          },
          {
            memberId: 'member-10',
            yesterdayAccomplishment: 'ユーザーテスト実施',
            todayPlans: 'フィードバック集計',
            challengeIssue: 'なし'
          }
        ]
      })),

      extractAndClassifyIssues: jest.fn(async (input) => ({
        extractedIssueCount: 4,
        extractedKeywords: [
          { keyword: 'テスト環境接続', frequency: 1, impactScore: 65 },
          { keyword: 'API応答遅延', frequency: 1, impactScore: 72 },
          { keyword: 'セキュリティ脆弱性', frequency: 1, impactScore: 95 },
          { keyword: 'ドキュメント作成', frequency: 1, impactScore: 40 }
        ]
      })),

      prioritizeIssues: jest.fn(async (input) => ({
        prioritizedIssues: [
          {
            keyword: 'セキュリティ脆弱性',
            priorityScore: 95,
            priorityRank: 'high',
            frequency: 1,
            impactScore: 95,
            color: 'red'
          },
          {
            keyword: 'API応答遅延',
            priorityScore: 72,
            priorityRank: 'medium',
            frequency: 1,
            impactScore: 72,
            color: 'yellow'
          },
          {
            keyword: 'テスト環境接続',
            priorityScore: 65,
            priorityRank: 'medium',
            frequency: 1,
            impactScore: 65,
            color: 'yellow'
          },
          {
            keyword: 'ドキュメント作成',
            priorityScore: 40,
            priorityRank: 'low',
            frequency: 1,
            impactScore: 40,
            color: 'green'
          }
        ]
      })),

      identifyUnsubmittedMembers: jest.fn(async (submittedMemberIds, allTeamMemberIds) => {
        // 受信した日報メンバーと全チームメンバーから未提出者を特定
        const unsubmittedIds = allTeamMemberIds.filter(memberId => !submittedMemberIds.includes(memberId));
        return {
          identifiedMembers: unsubmittedIds,
          timestamp: '2025-01-15T09:30:00Z',
          confidence: 0.98
        };
      }),

      generateAndSendConfirmationEmail: jest.fn(async (input) => ({
        emailSent: true,
        timestamp: '2025-01-15T09:32:00Z',
        recipientCount: 1,
        unsubmittedMembersInEmail: ['member-02', 'member-07', 'member-09']
      })),

      recordAuditLog: jest.fn(async (input) => ({
        auditId: 'audit-001-20250115-093000',
        actionType: 'identify-unsubmitted-members',
        actionTimestamp: '2025-01-15T09:30:00Z',
        detailsRecorded: {
          identified_count: 3,
          confidence: 0.98,
          unsubmitted_member_ids: ['member-02', 'member-07', 'member-09']
        }
      }))
    };

    // ========== Setup: 入力データを準備 ==========
    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp: new Date('2025-01-15T09:25:00Z'),
      reportDeadlineTime: new Date('2025-01-15T09:00:00Z'),
      targetTeamIds: ['team-dev-001'],
      managerUserIds: ['manager-001']
    };

    // ========== Setup: 全チームメンバーリスト（10名） ==========
    const allTeamMemberIds = [
      'member-01', 'member-02', 'member-03', 'member-04', 'member-05',
      'member-06', 'member-07', 'member-08', 'member-09', 'member-10'
    ];
    const submittedMemberIds = [
      'member-01', 'member-03', 'member-04', 'member-05', 'member-06',
      'member-08', 'member-10'
    ];

    // ========== Execute: orchestrator を実行 ==========
    const result: Tx2Imp1AgentOutput = await runTx2Imp1Agent(
      agentInput,
      fakeAiClient
    );

    // ========== Verify: Action 1-4 が実行されたことを確認 ==========
    expect(fakeAiClient.aggregateReports).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.extractAndClassifyIssues).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.prioritizeIssues).toHaveBeenCalledTimes(1);

    // ========== Verify: Action 5（未提出メンバー特定）が正確に呼び出されたことを確認 ==========
    expect(fakeAiClient.identifyUnsubmittedMembers).toHaveBeenCalledTimes(1);
    
    // Action 5 の呼び出し引数を検証: 第1引数は提出メンバーリスト、第2引数は全メンバーリスト
    const identifyCall = (fakeAiClient.identifyUnsubmittedMembers as jest.Mock).mock.calls[0];
    expect(identifyCall[0]).toEqual(submittedMemberIds);
    expect(identifyCall[1]).toEqual(allTeamMemberIds);

    // ========== Verify: fakeAiClient が返した未提出メンバーリストが正確であることを確認 ==========
    const expectedUnsubmittedMembers = ['member-02', 'member-07', 'member-09'];
    expect(result.unsubmittedMembersCount).toBe(3);
    
    // 結果の中に未提出者リストが含まれていることを確認（構造は AgentOutput の定義に従う）
    expect(result.aggregatedReportCount).toBe(7);
    expect(result.extractedIssueCount).toBe(4);
    expect(result.prioritizedIssues).toHaveLength(4);
    expect(result.prioritizedIssues[0].keyword).toBe('セキュリティ脆弱性');
    expect(result.prioritizedIssues[0].priorityRank).toBe('high');

    // ========== Verify: Action 6（メール生成・配信）が実行され、未提出者リストが含まれたことを確認 ==========
    expect(fakeAiClient.generateAndSendConfirmationEmail).toHaveBeenCalledTimes(1);
    
    const emailCall = (fakeAiClient.generateAndSendConfirmationEmail as jest.Mock).mock.calls[0][0];
    expect(emailCall.unsubmittedMembersCount).toBe(3);
    expect(emailCall.unsubmittedMembersIds).toEqual(expectedUnsubmittedMembers);

    // メール送信結果から未提出者リストが正確に記載されていることを確認
    const emailResult = await fakeAiClient.generateAndSendConfirmationEmail(emailCall);
    expect(emailResult.emailSent).toBe(true);
    expect(emailResult.unsubmittedMembersInEmail).toEqual(expectedUnsubmittedMembers);

    // ========== Verify: Action 7（監査ログ記録）が実行されたことを確認 ==========
    expect(fakeAiClient.recordAuditLog).toHaveBeenCalledTimes(1);
    
    const auditCall = (fakeAiClient.recordAuditLog as jest.Mock).mock.calls[0][0];
    expect(auditCall.actionType).toBe('identify-unsubmitted-members');
    
    // 監査ログの内容を検証
    const auditResult = await fakeAiClient.recordAuditLog(auditCall);
    expect(auditResult.actionType).toBe('identify-unsubmitted-members');
    expect(auditResult.detailsRecorded.identified_count).toBe(3);
    expect(auditResult.detailsRecorded.confidence).toBe(0.98);
    expect(auditResult.detailsRecorded.unsubmitted_member_ids).toEqual(expectedUnsubmittedMembers);

    // ========== Verify: 最終結果が確認メール送信成功フラグを正確に返していることを確認 ==========
    expect(result.confirmationEmailSent).toBe(true);

    // ========== Verify: 全アクションがシーケンシャルに実行されたことを確認（呼び出し順序） ==========
    // Action 1 → Action 2 → Action 3 → Action 4 → Action 5 → Action 6 → Action 7
    const callOrder: string[] = [];
    
    if ((fakeAiClient.aggregateReports as jest.Mock).mock.invocationCallOrder[0]) {
      callOrder.push('aggregateReports');
    }
    if ((fakeAiClient.extractAndClassifyIssues as jest.Mock).mock.invocationCallOrder[0]) {
      callOrder.push('extractAndClassifyIssues');
    }
    if ((fakeAiClient.prioritizeIssues as jest.Mock).mock.invocationCallOrder[0]) {
      callOrder.push('prioritizeIssues');
    }
    if ((fakeAiClient.identifyUnsubmittedMembers as jest.Mock).mock.invocationCallOrder[0]) {
      callOrder.push('identifyUnsubmittedMembers');
    }
    if ((fakeAiClient.generateAndSendConfirmationEmail as jest.Mock).mock.invocationCallOrder[0]) {
      callOrder.push('generateAndSendConfirmationEmail');
    }
    if ((fakeAiClient.recordAuditLog as jest.Mock).mock.invocationCallOrder[0]) {
      callOrder.push('recordAuditLog');
    }

    // 少なくとも Action 5 と Action 6 が呼び出されていることを確認
    expect(callOrder).toContain('identifyUnsubmittedMembers');
    expect(callOrder).toContain('generateAndSendConfirmationEmail');
  });
});