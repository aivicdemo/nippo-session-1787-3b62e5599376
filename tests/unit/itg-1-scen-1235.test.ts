import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AgentInput, type Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('Tx5Imp1Agent - 課題抽出から既存ツール連携・確認までの自律実行', () => {
  // SCEN-1235: [error] 既存ツール連携機能 - 連携設定が未完了のまま連携実行ボタンが押下されたとき処理が中断される
  test('should abort integration when tool configuration is incomplete and raise integration missing error', async () => {
    const mockAiClient: Tx5Imp1AiClient = {
      validateAndClassifyIssue: jest.fn().mockResolvedValue({
        issueId: 'ISSUE-001',
        priorityScore: 75,
        category: 'quality',
        validationStatus: 'valid',
      }),
      judgeIssuePriority: jest.fn().mockResolvedValue({
        issueId: 'ISSUE-001',
        priorityScore: 75,
        category: 'quality',
      }),
      mapCategoryToExternalTool: jest.fn().mockResolvedValue({
        issueId: 'ISSUE-001',
        toolCategory: 'Bug',
        toolProjectKey: 'PROJ',
      }),
      prepareToolIntegrationPayload: jest.fn().mockResolvedValue({
        issueId: 'ISSUE-001',
        externalToolPayload: {
          summary: 'Test Issue',
          description: 'Test Description',
          priority: 'High',
        },
      }),
      executeToolIntegration: jest.fn().mockResolvedValue({
        success: false,
        errorCode: 'INTEGRATION_CONFIG_MISSING',
        errorMessage: '連携設定が完了していません。管理画面で必要な設定を実施してください',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: Tx5Imp1AgentInput = {
      extractedIssueIds: ['ISSUE-001'],
      validationMode: 'auto',
      targetToolType: 'jira',
      projectManagerId: 'PM-001',
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.integrationStatus).toBe('retry_scheduled');
    expect(result.validationResult.passedCount).toBe(0);
    expect(result.validationResult.failedCount).toBe(1);
    expect(result.validationResult.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issueId: 'ISSUE-001',
          validationStatus: 'invalid',
          errorReason: expect.stringMatching(/連携設定/),
        }),
      ])
    );
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(result.confirmationEmailSent).toBe(false);
  });
});