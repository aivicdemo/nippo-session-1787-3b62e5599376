import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1 Agent: Initial Report Evaluation', () => {
  // SCEN-2583: [normal] 初回報告データ評価機能 - 提出率90%未満・データ品質スコア80点以上・形式統一度85%以上の場合、改善フェーズへの戻し判定が真になる
  test('should return shouldReturnToImprovementPhase as true when submissionRate is below 90% but dataQualityScore and formatUniformityScore meet thresholds', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const participantList = [
      { userId: 'eng001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'eng009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'eng010', role: 'Engineer', email: 'eng010@example.com' },
      { userId: 'pm001', role: 'ProjectManager', email: 'pm001@example.com' },
      { userId: 'manager001', role: 'Manager', email: 'manager001@example.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const mockAiClient = {
      evaluateInitialReports: jest.fn().mockResolvedValue({
        submissionRate: 89,
        dataQualityScore: 82,
        formatUniformityScore: 87,
        feedbackItems: [
          {
            userId: 'eng010',
            feedback: 'Please include more detail in your report',
            severity: 'warning' as const,
          },
        ],
      }),
      generateDeploymentSchedule: jest.fn().mockResolvedValue({
        startDate: new Date('2024-01-16T00:00:00Z'),
        trainingPhaseDeadline: new Date('2024-01-19T00:00:00Z'),
        initialTestPhaseDeadline: new Date('2024-01-22T00:00:00Z'),
        productionReadyDate: new Date('2024-01-29T00:00:00Z'),
      }),
      generateTrainingMaterials: jest.fn().mockResolvedValue([
        {
          targetRole: 'Manager',
          materialType: 'guide',
          title: 'Manager Guide for Daily Report System',
          content: 'Guide content for managers...',
          format: 'pdf',
        },
        {
          targetRole: 'Engineer',
          materialType: 'tutorial',
          title: 'Engineer Training Module',
          content: 'Training content for engineers...',
          format: 'video',
        },
      ]),
      assessOnboardingApproval: jest.fn().mockResolvedValue({
        isApproved: false,
        reason: 'Submission rate below 90% threshold',
        recommendedAction: 'return_to_improvement_phase',
      }),
    };

    const result: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    expect(result.initialReportAnalysis.submissionRate).toBe(89);
    expect(result.initialReportAnalysis.dataQualityScore).toBe(82);
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(87);
    expect(result.onboardingApprovalStatus.isApproved).toBe(false);
    expect(result.onboardingApprovalStatus.recommendedAction).toBe(
      'return_to_improvement_phase'
    );
  });
});