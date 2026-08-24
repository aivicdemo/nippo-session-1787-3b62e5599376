import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  OnboardingApprovalStatus,
  InitialReportAnalysisResult,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告アプリ初期導入・ユーザー教育 - tx_10_imp_1', () => {
  // SCEN-2634
  test('[normal] 本運用移行判定 - 不合格者が残存する場合、本運用移行移行不可と判定される', async () => {
    const deploymentInitiationTimestamp = new Date('2024-03-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';

    const participants: DeploymentParticipant[] = [
      {
        userId: 'ENG001',
        role: 'Engineer',
        email: 'eng001@example.com',
      },
      {
        userId: 'ENG002',
        role: 'Engineer',
        email: 'eng002@example.com',
      },
      {
        userId: 'ENG003',
        role: 'Engineer',
        email: 'eng003@example.com',
      },
      {
        userId: 'ENG004',
        role: 'Engineer',
        email: 'eng004@example.com',
      },
      {
        userId: 'ENG005',
        role: 'Engineer',
        email: 'eng005@example.com',
      },
      {
        userId: 'ENG006',
        role: 'Engineer',
        email: 'eng006@example.com',
      },
      {
        userId: 'ENG007',
        role: 'Engineer',
        email: 'eng007@example.com',
      },
      {
        userId: 'ENG008',
        role: 'Engineer',
        email: 'eng008@example.com',
      },
      {
        userId: 'ENG009',
        role: 'Engineer',
        email: 'eng009@example.com',
      },
      {
        userId: 'ENG010',
        role: 'Engineer',
        email: 'eng010@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: participants,
      preparationDaysRequired: 5,
      reportingDeadlineTime,
    };

    const mockAiClient = {
      evaluateInitialReportQuality: async (
        reportData: object
      ): Promise<InitialReportAnalysisResult> => {
        return {
          submissionRate: 80,
          dataQualityScore: 82,
          formatUniformityScore: 78,
          feedbackItems: [
            {
              userId: 'ENG009',
              feedback: '形式が不統一。再実習が必要。',
            },
            {
              userId: 'ENG010',
              feedback: 'データ品質が低い。再教育を推奨。',
            },
          ],
        };
      },
      assessOperationalReadiness: async (
        evaluationResult: object
      ): Promise<OnboardingApprovalStatus> => {
        return {
          approvalStatus: 'rejected',
          approvalReason: '不合格者が2名存在するため本運用移行要件を満たさない',
          productionStartDate: null,
        };
      },
    };

    const result: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    expect(result.onboardingApprovalStatus).toBeDefined();
    expect(result.onboardingApprovalStatus.approvalStatus).toBe('rejected');
    expect(result.onboardingApprovalStatus.approvalReason).toMatch(/不合格者/);
    expect(result.onboardingApprovalStatus.approvalReason).toMatch(/2名/);
    expect(result.onboardingApprovalStatus.productionStartDate).toBeNull();

    expect(result.initialReportAnalysis).toBeDefined();
    expect(result.initialReportAnalysis.submissionRate).toBe(80);
    expect(result.initialReportAnalysis.dataQualityScore).toBe(82);
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(78);
    expect(result.initialReportAnalysis.feedbackItems).toHaveLength(2);
    expect(result.initialReportAnalysis.feedbackItems[0].userId).toBe('ENG009');
    expect(result.initialReportAnalysis.feedbackItems[1].userId).toBe('ENG010');
  });
});