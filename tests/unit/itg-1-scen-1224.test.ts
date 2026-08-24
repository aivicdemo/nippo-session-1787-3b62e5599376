import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type {
  Tx5Imp1AgentInput,
  Tx5Imp1AgentOutput,
} from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 agent: 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1224
  test('優先度スコアが0のとき、後続の課題処理が中断され、日報送信は正常に完了する', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: 2,
            confidenceScore: 0.92,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        issueId: 'issue-001',
        impactScore: 0,
        affectedTeamMembers: 0,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        issueId: 'issue-001',
        severity: 'low',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: 'sent', deliveryTimestamp: new Date().toISOString() }),
      scheduleNotification: jest
        .fn()
        .mockResolvedValue({ scheduledId: 'sched-001', nextFireAt: '2024-01-15T09:00:00Z' }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ status: 'delivered', sentAt: '2024-01-15T08:30:00Z' }),
    };

    const mockSystemLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueIds: ['issue-001'],
      validationMode: 'auto',
      targetToolType: 'jira',
      projectManagerId: 'pm-user-001',
    };

    const output = await runTx5Imp1Agent(input, mockTextAnalysisAdapter, mockNotificationAdapter, mockSystemLogger);

    expect(output).toBeDefined();
    expect(output.validationResult).toBeDefined();
    expect(output.integrationStatus).toBe('success');
    expect(output.confirmationEmailSent).toBe(true);

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith({
      issueId: 'issue-001',
    });

    expect(mockSystemLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('優先度スコア 0 のため課題分析処理を中断'),
    );

    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});