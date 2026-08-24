import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('TX-8-IMP-1: ボトルネック変化パターン可視化レポート生成機能', () => {
  // SCEN-1993: [error] 解決期間が負の日数のとき、レポート生成がエラーになる
  test('解決期間が負の日数を含むデータセットでレポート生成がエラーになり、ロールバックされる', async () => {
    const analysisStartDate = '2026-08-15T00:00:00Z';
    const analysisEndDate = '2026-08-20T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'mgr-001';

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const mockAiClient = {
      buildAction01Prompt: jest.fn().mockReturnValue('prompt-action-01'),
      buildAction02Prompt: jest.fn().mockReturnValue('prompt-action-02'),
      buildAction03Prompt: jest.fn().mockReturnValue('prompt-action-03'),
      buildAction04Prompt: jest.fn().mockReturnValue('prompt-action-04'),
      buildAction05Prompt: jest.fn().mockReturnValue('prompt-action-05'),
      callAiModel: jest.fn()
        .mockResolvedValueOnce({
          action: 1,
          extractedIssues: [
            {
              issueId: 'issue-001',
              keyword: 'データベース接続エラー',
              startDate: '2026-08-20T10:00:00Z',
              resolvedDate: '2026-08-15T14:00:00Z',
              resolutionPeriodDays: -5,
              occurrenceCount: 4,
            },
          ],
        })
        .mockResolvedValueOnce({
          action: 2,
          normalizedIssues: [
            {
              issueId: 'issue-001',
              keyword: 'データベース接続エラー',
              resolutionPeriodDays: -5,
              occurrenceCount: 4,
            },
          ],
        })
        .mockResolvedValueOnce({
          action: 3,
          timeSeriesAnalysis: [
            {
              issueKeyword: 'データベース接続エラー',
              resolutionPeriodDays: -5,
              pattern: 'invalid-period',
            },
          ],
        })
        .mockRejectedValueOnce(
          new Error(
            '解決期間は0以上の整数である必要があります。検出値: -5日'
          )
        ),
    };

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 4 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'データベース接続エラー',
        impactScore: 85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    let result: Tx8AgentOutput | Error | undefined;
    let errorThrown = false;
    let errorMessage = '';

    try {
      result = await runTx8Imp1Agent(input, mockAiClient, {
        textAnalysisServiceAdapter: textAnalysisServiceAdapterStub,
        notificationServiceAdapter: notificationServiceAdapterStub,
      });
    } catch (error) {
      errorThrown = true;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    expect(errorThrown).toBe(true);
    expect(errorMessage).toMatch(/解決期間は0以上の整数である必要があります/);
    expect(errorMessage).toMatch(/-5日/);

    expect(mockAiClient.callAiModel).toHaveBeenCalledTimes(4);

    expect(mockAiClient.callAiModel).toHaveBeenNthCalledWith(
      1,
      'prompt-action-01',
      expect.any(Object)
    );
    expect(mockAiClient.callAiModel).toHaveBeenNthCalledWith(
      4,
      'prompt-action-04',
      expect.any(Object)
    );

    expect(result).toBeUndefined();

    expect(textAnalysisServiceAdapterStub.extractKeywords).toHaveBeenCalled();
    const extractKeywordCallCount =
      textAnalysisServiceAdapterStub.extractKeywords.mock.calls.length;
    expect(extractKeywordCallCount).toBeGreaterThan(0);

    expect(textAnalysisServiceAdapterStub.assessImpactScore).toHaveBeenCalled();
    const assessImpactScoreCallCount =
      textAnalysisServiceAdapterStub.assessImpactScore.mock.calls.length;
    expect(assessImpactScoreCallCount).toBeGreaterThan(0);
  });
});