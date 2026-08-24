import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 初回報告データ品質評価機能', () => {
  // SCEN-2587
  test('提出率が空文字列のとき評価処理がエラーになる', async () => {
    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: 'テスト', frequency: 1 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 50,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const participantList = [
      {
        userId: 'user-001',
        role: 'Engineer',
        email: 'engineer001@example.com',
      },
      {
        userId: 'user-002',
        role: 'Engineer',
        email: 'engineer002@example.com',
      },
      {
        userId: 'user-003',
        role: 'Engineer',
        email: 'engineer003@example.com',
      },
      {
        userId: 'user-004',
        role: 'Engineer',
        email: 'engineer004@example.com',
      },
      {
        userId: 'user-005',
        role: 'Engineer',
        email: 'engineer005@example.com',
      },
      {
        userId: 'user-006',
        role: 'Engineer',
        email: 'engineer006@example.com',
      },
      {
        userId: 'user-007',
        role: 'Engineer',
        email: 'engineer007@example.com',
      },
      {
        userId: 'user-008',
        role: 'Engineer',
        email: 'engineer008@example.com',
      },
      {
        userId: 'user-009',
        role: 'Engineer',
        email: 'engineer009@example.com',
      },
      {
        userId: 'user-010',
        role: 'Engineer',
        email: 'engineer010@example.com',
      },
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'manager-001',
        role: 'Manager',
        email: 'manager@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const corruptedInitialReportAnalysis: InitialReportAnalysisResult = {
      submissionRate: '' as any,
      dataQualityScore: 85,
      formatUniformityScore: 90,
      feedbackItems: [
        {
          userId: 'user-001',
          message: 'テスト報告内容が不十分です',
        },
      ],
    };

    await expect(
      runTx10Imp1Agent(input, mockAiClient, corruptedInitialReportAnalysis),
    ).rejects.toThrow(/提出率/);
  });
});