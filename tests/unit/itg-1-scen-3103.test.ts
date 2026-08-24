import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/types';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/types';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行 - エスカレーション', () => {
  // SCEN-3103
  test('重大インシデント検出時は副作用確定前に部長へ制御を引き継ぐ', async () => {
    // テスト用の注入済みフェイクAIクライアントを初期化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'システム停止', frequency: 3, confidenceScore: 0.92 },
          { keyword: '顧客クレーム発生', frequency: 2, confidenceScore: 0.88 },
          { keyword: 'データベース接続失敗', frequency: 1, confidenceScore: 0.85 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        issueId: 'issue-001',
        impactScore: 95,
        affectedTeamCount: 5,
      }),
      classifyIssueSeverity: jest.fn()
        .mockImplementation((keywords: Array<{ keyword: string; frequency: number }>) => {
          // 重大インシデントキーワード検出
          const hasCriticalKeywords = keywords.some(
            (kw) => kw.keyword.includes('システム停止') || kw.keyword.includes('顧客クレーム発生')
          );
          if (hasCriticalKeywords) {
            return Promise.resolve({
              severity: 'CRITICAL',
              classification: 'CRITICAL_INCIDENT',
              requiresImmediateEscalation: true,
            });
          }
          return Promise.resolve({
            severity: 'HIGH',
            classification: 'NORMAL_ISSUE',
            requiresImmediateEscalation: false,
          });
        }),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryId: 'notif-123',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduleId: 'sched-456' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const mockEmailService = {
      sendConfirmationEmail: jest.fn().mockResolvedValue({
        messageId: 'email-789',
        status: 'sent',
      }),
    };

    const fakeAiClient: Tx2Imp1AiClient = {
      textAnalysisService: mockTextAnalysisServiceAdapter,
      notificationService: mockNotificationServiceAdapter,
      emailService: mockEmailService,
    };

    // 重大インシデントが報告された日報データを準備
    const criticalIncidentReports = [
      {
        reportId: 'report-critical-001',
        memberId: 'member-001',
        reportDate: new Date('2024-01-15'),
        submittedAt: new Date('2024-01-15T08:45:00Z'),
        yesterday: 'システム障害対応',
        today: 'クリティカル問題調査',
        challenges:
          'システム停止が発生。顧客クレーム対応中。データベース接続失敗により全機能停止状態。',
      },
    ];

    const unsubmittedMembers = [
      { memberId: 'member-002', memberName: 'Engineer B' },
      { memberId: 'member-003', memberName: 'Engineer C' },
    ];

    const testInput: Tx2Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:30:00Z'),
      targetTeamIds: ['team-001'],
      managerUserIds: ['manager-001'],
      aggregatedReports: criticalIncidentReports,
      unsubmittedMembersInfo: unsubmittedMembers,
    };

    // オーケストレータ実行
    const result = await runTx2Imp1Agent(testInput, fakeAiClient);

    // エスカレーション条件の検証：結果にescalationRequiredフラグが含まれる
    expect(result).toHaveProperty('escalationRequired');
    expect(result.escalationRequired).toBe(true);

    // エスカレーション理由がCRITICAL_INCIDENTである
    expect(result).toHaveProperty('escalationReason');
    expect(result.escalationReason).toBe('CRITICAL_INCIDENT');

    // 保留中のアクション情報を確認：日報IDと抽出課題データが含まれる
    expect(result).toHaveProperty('pendingActions');
    expect(Array.isArray(result.pendingActions)).toBe(true);
    expect(result.pendingActions.length).toBeGreaterThan(0);

    const pendingAction = result.pendingActions[0];
    expect(pendingAction).toHaveProperty('reportId');
    expect(pendingAction.reportId).toBe('report-critical-001');
    expect(pendingAction).toHaveProperty('extractedIssues');

    // ハンドオーバーターゲットが管理者承認キューである
    expect(result).toHaveProperty('handoverTarget');
    expect(result.handoverTarget).toBe('manager_approval_queue');

    // 確認メール送信が実行されていないことを検証
    expect(mockEmailService.sendConfirmationEmail).not.toHaveBeenCalled();

    // 通知サービスが呼び出されていないことを検証
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // 集約結果と抽出課題数が存在（部分的な処理は完了）
    expect(result).toHaveProperty('aggregatedReportCount');
    expect(result.aggregatedReportCount).toBe(1);

    expect(result).toHaveProperty('extractedIssueCount');
    expect(result.extractedIssueCount).toBeGreaterThan(0);

    // 重大課題のみが抽出結果に含まれることを確認
    expect(result).toHaveProperty('prioritizedIssues');
    if (result.prioritizedIssues && result.prioritizedIssues.length > 0) {
      const criticalIssues = result.prioritizedIssues.filter(
        (issue) => issue.severity === 'CRITICAL'
      );
      expect(criticalIssues.length).toBeGreaterThan(0);
    }

    // 確認メール送信フラグがfalseである
    expect(result).toHaveProperty('confirmationEmailSent');
    expect(result.confirmationEmailSent).toBe(false);

    // 部長がこのエスカレーションケースを確認待ちキューから受け取ることが可能な状態
    expect(result).toHaveProperty('requiresManagerApproval');
    expect(result.requiresManagerApproval).toBe(true);
  });
});