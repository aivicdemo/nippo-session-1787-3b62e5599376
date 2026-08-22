import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11AgentInput, Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('Tx11 日報収集・確認・催促の自動化エージェント', () => {
  let mockAiClient: Tx11Imp1AiClient;
  let mockConfirmationWaitingState: jest.Mock;
  let mockSendEmailNotification: jest.Mock;
  let mockDisplayConfirmationUI: jest.Mock;
  let mockGetConfirmationStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfirmationWaitingState = jest.fn().mockResolvedValue({
      issueId: 'ISSUE-001',
      status: 'awaiting_confirmation',
      timestamp: new Date('2024-01-15T09:00:00Z'),
    });

    mockSendEmailNotification = jest.fn().mockResolvedValue({
      sent: false,
      reason: 'blocked_by_confirmation_pending',
    });

    mockDisplayConfirmationUI = jest.fn().mockResolvedValue({
      displayed: true,
      uiEventId: 'UI-EVENT-001',
    });

    mockGetConfirmationStatus = jest.fn().mockResolvedValue({
      status: 'awaiting_manager_decision',
      issues: [
        {
          issueId: 'ISSUE-001',
          severity: 'high',
          memberName: 'member-alpha',
          description: '重大度が高い課題',
        },
        {
          issueId: 'ISSUE-002',
          severity: 'high',
          memberName: 'member-beta',
          description: '複数メンバーから検出された別の重大度高い課題',
        },
      ],
    });

    mockAiClient = {
      extractIssuesFromReport: jest.fn().mockResolvedValue({
        issues: [
          {
            issueId: 'ISSUE-001',
            memberName: 'member-alpha',
            yesterday: 'リポジトリの緊急修正対応',
            today: 'デプロイ検証',
            problemStatement: '本番環境でDBコネクション枯渇が発生。影響: 全ユーザーのアクセス不可',
            severity: 'high',
            category: 'infrastructure',
          },
          {
            issueId: 'ISSUE-002',
            memberName: 'member-beta',
            yesterday: '通常業務',
            today: 'テスト実施',
            problemStatement: '同期型バッチ処理がタイムアウト。影響: 月次集計が完了しない',
            severity: 'high',
            category: 'performance',
          },
        ],
      }),
      detectUnsubmittedMembers: jest.fn().mockResolvedValue({
        unsubmittedMembers: ['member-gamma'],
      }),
      generateMorningBriefing: jest.fn().mockResolvedValue({
        briefing:
          '本日の朝会用サマリー: 重大度高い課題が2件検出されています。部長の確認待ちです。',
      }),
    } as unknown as Tx11Imp1AiClient;
  });

  // SCEN-202
  test('重大度が高い課題が検出された場合、部長への即座通知メール送信は副作用実行前に一時停止され、確認待ち状態に遷移することを確認する', async () => {
    const input: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      teamId: 'team-001',
      reportDeadlineTime: '09:30',
      managerEmail: 'manager@company.com',
    };

    const mockAiClientWithConfirmation = {
      ...mockAiClient,
      transitionToConfirmationWaiting: mockConfirmationWaitingState,
      blockEmailNotification: mockSendEmailNotification,
      displayConfirmationPrompt: mockDisplayConfirmationUI,
      checkConfirmationStatus: mockGetConfirmationStatus,
    } as unknown as Tx11Imp1AiClient;

    const output = await runTx11Imp1Agent(input, mockAiClientWithConfirmation);

    // 重大度が高い課題が抽出されたことを確認
    expect(mockAiClient.extractIssuesFromReport).toHaveBeenCalled();

    // 確認待ち状態への遷移が呼ばれたことを確認（副作用実行前に確認フロー開始）
    expect(mockConfirmationWaitingState).toHaveBeenCalledWith(
      expect.objectContaining({
        issueIds: ['ISSUE-001', 'ISSUE-002'],
        severity: 'high',
      })
    );

    // メール送信がブロックされていることを確認
    expect(mockSendEmailNotification).toHaveBeenCalled();
    const emailBlockResult = await mockSendEmailNotification();
    expect(emailBlockResult.sent).toBe(false);
    expect(emailBlockResult.reason).toBe('blocked_by_confirmation_pending');

    // 確認UIが表示されたことを確認（部長への確認画面発火）
    expect(mockDisplayConfirmationUI).toHaveBeenCalledWith(
      expect.objectContaining({
        managerEmail: 'manager@company.com',
        issues: expect.arrayContaining([
          expect.objectContaining({
            memberName: 'member-alpha',
            problemStatement: '本番環境でDBコネクション枯渇が発生。影響: 全ユーザーのアクセス不可',
          }),
          expect.objectContaining({
            memberName: 'member-beta',
            problemStatement: '同期型バッチ処理がタイムアウト。影響: 月次集計が完了しない',
          }),
        ]),
      })
    );

    // 確認待ち状態を確認
    const confirmationStatus = await mockGetConfirmationStatus();
    expect(confirmationStatus.status).toBe('awaiting_manager_decision');
    expect(confirmationStatus.issues).toHaveLength(2);
    expect(confirmationStatus.issues[0].severity).toBe('high');
    expect(confirmationStatus.issues[1].severity).toBe('high');

    // オーケストレーターの出力が確認待ち状態を反映していることを確認
    expect(output).toEqual(
      expect.objectContaining({
        submissionStatus: expect.objectContaining({
          unsubmittedMembers: ['member-gamma'],
        }),
        prioritizedIssues: expect.arrayContaining([
          expect.objectContaining({
            severity: 'high',
            awaitingManagerConfirmation: true,
          }),
          expect.objectContaining({
            severity: 'high',
            awaitingManagerConfirmation: true,
          }),
        ]),
        summaryEmailSent: false, // 確認待ち中は朝会用サマリーメール未送信
      })
    );
  });
});