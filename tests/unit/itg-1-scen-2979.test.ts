import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算 - 外部API失敗時のエラー伝播', () => {
  // SCEN-2979
  test('TextAnalysisServiceAdapter が extractKeywords で失敗したとき、エラーが正しく伝播される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('APIConnectionError: OpenAI API 接続失敗')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'チーム間の連携ツール障害により業務進捗が停滞',
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    let caughtError: Error | null = null;
    let retryAttempts = 0;

    try {
      await calculateIssuePriorityScore(
        input,
        mockTextAnalysisAdapter,
        mockNotificationAdapter
      );
    } catch (error) {
      caughtError = error as Error;
      retryAttempts = mockTextAnalysisAdapter.extractKeywords.mock.calls.length;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/APIConnectionError/);
    expect(caughtError?.message).toMatch(/OpenAI API 接続失敗/);
    expect(retryAttempts).toBe(4);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(4);
  });
});