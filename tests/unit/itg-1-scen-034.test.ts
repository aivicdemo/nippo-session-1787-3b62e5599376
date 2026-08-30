import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentExecutionContext } from '../../src/agents/tx-11-imp-1/types';

describe('Tx11Imp1Agent - 日報収集・確認・催促の自動化エージェント', () => {
  // SCEN-034: [error] 報告提出状況テーブルへのアクセス失敗時の例外処理
  test('should throw SubmissionStatusRetrievalError when accessing submission status table fails', async () => {
    const context: Tx11AgentExecutionContext = {
      executionTimestamp: new Date('2024-01-15T08:00:00Z'),
      reportDeadlineTime: '09:30',
      targetTeamIds: ['team-001'],
      managerUserId: 'manager-user-001'
    };

    const mockAiClient = {
      detectUnsubmittedMembers: jest.fn().mockRejectedValueOnce(
        new Error('日報提出状況の取得に失敗しました。システム管理者に連絡してください。')
      ),
      sendUnsubmittedMemberReminders: jest.fn(),
      extractAndRankIssuesFromReports: jest.fn(),
      prepareDashboardData: jest.fn(),
      generateAndSendManagerConfirmationEmail: jest.fn()
    };

    await expect(runTx11Imp1Agent(context, mockAiClient)).rejects.toThrow(
      /日報提出状況の取得に失敗しました/
    );

    expect(mockAiClient.detectUnsubmittedMembers).toHaveBeenCalledTimes(1);
    expect(mockAiClient.sendUnsubmittedMemberReminders).not.toHaveBeenCalled();
    expect(mockAiClient.extractAndRankIssuesFromReports).not.toHaveBeenCalled();
    expect(mockAiClient.prepareDashboardData).not.toHaveBeenCalled();
    expect(mockAiClient.generateAndSendManagerConfirmationEmail).not.toHaveBeenCalled();
  });
});