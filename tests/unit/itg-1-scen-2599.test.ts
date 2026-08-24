import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 初回報告データ品質評価機能', () => {
  // SCEN-2599: [error] 初回報告データ品質評価機能 - 形式統一度が100を超える数のとき評価処理がエラーになる
  test('形式統一度が100を超える値を受け取ったときはバリデーションエラーをスローする', async () => {
    const mockAiClient = {
      analyzeInitialReportQuality: jest.fn().mockResolvedValue({
        submissionRate: 90,
        dataQualityScore: 85,
        formatUniformityScore: 101,
        feedbackItems: [],
      }),
    };

    const deploymentInitiationTimestamp = new Date('2026-08-19T09:00:00Z');
    const participantList = [
      {
        userId: 'eng001',
        role: 'Engineer',
        email: 'eng001@example.com',
      },
      {
        userId: 'eng002',
        role: 'Engineer',
        email: 'eng002@example.com',
      },
      {
        userId: 'eng003',
        role: 'Engineer',
        email: 'eng003@example.com',
      },
      {
        userId: 'eng004',
        role: 'Engineer',
        email: 'eng004@example.com',
      },
      {
        userId: 'eng005',
        role: 'Engineer',
        email: 'eng005@example.com',
      },
      {
        userId: 'eng006',
        role: 'Engineer',
        email: 'eng006@example.com',
      },
      {
        userId: 'eng007',
        role: 'Engineer',
        email: 'eng007@example.com',
      },
      {
        userId: 'eng008',
        role: 'Engineer',
        email: 'eng008@example.com',
      },
      {
        userId: 'eng009',
        role: 'Engineer',
        email: 'eng009@example.com',
      },
      {
        userId: 'eng010',
        role: 'Engineer',
        email: 'eng010@example.com',
      },
    ];
    const preparationDaysRequired = 5;
    const reportingDeadlineTime = '09:00';

    const input = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    await expect(
      runTx10Imp1Agent(input, mockAiClient)
    ).rejects.toThrow(/形式統一度|formatUniformityScore|Invalid format uniformity score/);
  });
});