import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import { type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';
import { type Tx2Imp1AgentInput, type Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/types';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行', () => {
  test('SCEN-3106: 暗号化または特殊形式の日報受信時にエスカレーション引き継ぎが発動し、副作用が確定されない', async () => {
    // Setup: モック化されたサービス適配器を定義
    const notificationServiceAdapterMock: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ sent: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'success' }),
    };

    const textAnalysisServiceAdapterMock: TextAnalysisServiceAdapter = {
      extractKeywords: jest
        .fn()
        .mockRejectedValueOnce(
          new Error('解析不可: 暗号化または認識不可形式'),
        )
        .mockResolvedValueOnce({ keywords: [], frequency: [] }),
      assessImpactScore: jest
        .fn()
        .mockResolvedValue({ score: 0, confidence: 0 }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValue({ severity: 'unknown' }),
    };

    const aiClientMock: Tx2Imp1AiClient = {
      buildAction01Prompt: jest
        .fn()
        .mockReturnValue('action_01_prompt_content'),
      callAction01: jest.fn().mockResolvedValue({
        submittedReportCount: 9,
        unsubmittedMemberIds: ['member_10'],
        reports: [
          {
            reportId: 'report_001',
            memberId: 'member_001',
            receivedAt: new Date('2024-01-15T08:50:00Z'),
            format: 'json',
            content: '{"yesterday":"completed task","today":"plan","issues":""}',
            isEncryptedOrSpecial: false,
          },
          {
            reportId: 'report_002_encrypted',
            memberId: 'member_002',
            receivedAt: new Date('2024-01-15T08:55:00Z'),
            format: 'base64_encrypted',
            content:
              'SGVsbG8gV29ybGQgRW5jcnlwdGVkIERhdGEgSW4gQmFzZTY0IEZvcm1hdA==',
            isEncryptedOrSpecial: true,
          },
        ],
      }),
      buildAction02Prompt: jest
        .fn()
        .mockReturnValue('action_02_prompt_content'),
      callAction02: jest.fn(),
      buildAction03Prompt: jest
        .fn()
        .mockReturnValue('action_03_prompt_content'),
      callAction03: jest.fn(),
      buildAction04Prompt: jest
        .fn()
        .mockReturnValue('action_04_prompt_content'),
      callAction04: jest.fn(),
      buildAction05Prompt: jest
        .fn()
        .mockReturnValue('action_05_prompt_content'),
      callAction05: jest.fn(),
      buildAction06Prompt: jest
        .fn()
        .mockReturnValue('action_06_prompt_content'),
      callAction06: jest.fn(),
    };

    const input: Tx2Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:30:00Z'),
      targetTeamIds: ['team_001', 'team_002'],
      managerUserIds: ['manager_001'],
    };

    // Execute: orchestratorを呼び出し
    const output = await runTx2Imp1Agent(input, aiClientMock);

    // Assert: エスカレーション引き継ぎが発動したことを検証
    expect(output.status).toBe('escalation_required');
    expect(output.escalationReason).toBe('encrypted_or_special_format_detected');
    expect(output.affectedReportIds).toContain('report_002_encrypted');
    expect(output.escalationMessage).toMatch(/暗号化または認識できない特殊形式/);
    expect(output.handoverTargetRole).toBe('manager');
    expect(output.handoverData).toMatchObject({
      reportId: 'report_002_encrypted',
      receivedFormat: 'base64_encrypted',
      actionRequired: 'manual_decryption_or_format_conversion',
    });

    // Assert: 受信タイムスタンプが正確に記録されている
    expect(output.handoverData.receivedTimestamp).toBe(
      '2024-01-15T08:55:00Z',
    );

    // Assert: 課題抽出・配信アクション（アクション3〜6）は実行されないことを検証
    expect(aiClientMock.callAction03).not.toHaveBeenCalled();
    expect(aiClientMock.callAction04).not.toHaveBeenCalled();
    expect(aiClientMock.callAction05).not.toHaveBeenCalled();
    expect(aiClientMock.callAction06).not.toHaveBeenCalled();

    // Assert: 副作用（メール配信、課題DB登録）が確定されていないことを検証
    expect(output.aggregatedReportCount).toBeUndefined();
    expect(output.extractedIssueCount).toBeUndefined();
    expect(output.prioritizedIssues).toBeUndefined();
    expect(output.confirmationEmailSent).toBe(false);

    // Assert: 正常な日報がロールバックされ、処理から除外されていることを検証
    expect(output.affectedReportIds).toHaveLength(1);
    expect(output.affectedReportIds).not.toContain('report_001');

    // Assert: アクション1（受信状況確認）は実行されていることを検証
    expect(aiClientMock.callAction01).toHaveBeenCalled();

    // Assert: アクション2（フォーマット変換）の途中で失敗し、後続アクションが実行されないことを検証
    expect(aiClientMock.callAction02).toHaveBeenCalled();

    // Assert: 監査ログ情報が含まれていることを検証
    expect(output.auditLog).toMatchObject({
      escalationPoint: 'action_02_format_conversion',
      reason: 'encrypted_or_special_format',
      timestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
      ),
      handledBy: 'runTx2Imp1Agent',
      nextStep: 'manual_manager_review',
    });
  });
});