import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('TX-10 Initial Deployment & User Education - Operational Readiness Assessment', () => {
  // SCEN-2611: [edge] 初回テスト運用判定機能 - 提出率が90%を超えるとき本格運用への移行条件を満たす
  test('should transition to TEST_OPERATION_COMPLETE status when submission rate is 90% (9 out of 10 members submitted)', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T06:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    // Create 10 team participants (ProjectManager, Manager, Engineers)
    const participantList: DeploymentParticipant[] = [
      {
        userId: 'pm_001',
        role: 'ProjectManager',
        email: 'pm001@example.com',
      },
      {
        userId: 'mgr_001',
        role: 'Manager',
        email: 'manager001@example.com',
      },
      {
        userId: 'eng_001',
        role: 'Engineer',
        email: 'engineer001@example.com',
      },
      {
        userId: 'eng_002',
        role: 'Engineer',
        email: 'engineer002@example.com',
      },
      {
        userId: 'eng_003',
        role: 'Engineer',
        email: 'engineer003@example.com',
      },
      {
        userId: 'eng_004',
        role: 'Engineer',
        email: 'engineer004@example.com',
      },
      {
        userId: 'eng_005',
        role: 'Engineer',
        email: 'engineer005@example.com',
      },
      {
        userId: 'eng_006',
        role: 'Engineer',
        email: 'engineer006@example.com',
      },
      {
        userId: 'eng_007',
        role: 'Engineer',
        email: 'engineer007@example.com',
      },
      {
        userId: 'eng_008',
        role: 'Engineer',
        email: 'engineer008@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // Mock AI client with evaluation result showing 90% submission rate
    const mockAiClient = {
      evaluateInitialReports: jest.fn().mockResolvedValue({
        submissionRate: 90.0,
        dataQualityScore: 82,
        formatUniformityScore: 87,
        feedbackItems: [
          {
            userId: 'eng_008',
            feedbackCategory: 'MISSING_FIELD',
            feedbackMessage: 'The "challenges" section was incomplete',
          },
        ],
      }),
      assessOperationalReadiness: jest.fn().mockResolvedValue({
        onboardingApprovalStatus: 'APPROVED',
        deploymentSchedule: {
          startDate: '2024-01-20',
          trainingPhaseDeadline: '2024-01-22',
          initialTestDeadline: '2024-01-26',
          productionStartDate: '2024-01-27',
        },
        trainingMaterials: [
          {
            materialId: 'mat_001',
            title: 'Manager Guide - Daily Report System',
            targetRole: 'Manager',
            format: 'PDF',
          },
          {
            materialId: 'mat_002',
            title: 'Engineer Training - Report Input Workflow',
            targetRole: 'Engineer',
            format: 'VIDEO',
          },
        ],
      }),
    };

    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    // Assertions
    expect(output).toBeDefined();

    // Verify submission rate is exactly 90.0%
    expect(output.initialReportAnalysis.submissionRate).toBe(90.0);

    // Verify data quality score (should be >= 80 for approval)
    expect(output.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(80);

    // Verify format uniformity score (should be >= 85 for approval)
    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(85);

    // Verify onboarding approval status is APPROVED
    expect(output.onboardingApprovalStatus).toBe('APPROVED');

    // Verify deployment schedule contains all required fields
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.startDate).toBeDefined();
    expect(output.deploymentSchedule.trainingPhaseDeadline).toBeDefined();
    expect(output.deploymentSchedule.initialTestDeadline).toBeDefined();
    expect(output.deploymentSchedule.productionStartDate).toBeDefined();

    // Verify training materials are generated for both Manager and Engineer roles
    expect(output.trainingMaterials).toHaveLength(2);
    const managerMaterial = output.trainingMaterials.find(
      (m) => m.targetRole === 'Manager'
    );
    const engineerMaterial = output.trainingMaterials.find(
      (m) => m.targetRole === 'Engineer'
    );
    expect(managerMaterial).toBeDefined();
    expect(engineerMaterial).toBeDefined();

    // Verify feedback is provided for the one non-submitting engineer
    expect(output.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(output.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(0);

    // Verify AI client methods were called with correct arguments
    expect(mockAiClient.evaluateInitialReports).toHaveBeenCalledWith(
      expect.objectContaining({
        participantCount: 10,
        submittedCount: 9,
      })
    );

    expect(mockAiClient.assessOperationalReadiness).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionRate: 90.0,
        dataQualityScore: 82,
        formatUniformityScore: 87,
      })
    );
  });
});