import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('Tx10 朝会報告アプリ初期導入・ユーザー教育 - 再教育対象者抽出', () => {
  // SCEN-2627: [normal] 再教育対象者の抽出 - 不合格エンジニアのみが再教育対象として抽出される
  test('should extract only failed engineers as retraining candidates', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList = [
      {
        userId: 'ENG001',
        role: 'Engineer',
        email: 'engineer.a@example.com',
      },
      {
        userId: 'ENG002',
        role: 'Engineer',
        email: 'engineer.b@example.com',
      },
      {
        userId: 'ENG003',
        role: 'Engineer',
        email: 'engineer.c@example.com',
      },
      {
        userId: 'ENG004',
        role: 'Engineer',
        email: 'engineer.d@example.com',
      },
      {
        userId: 'PM001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'MGR001',
        role: 'Manager',
        email: 'manager@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const mockAiClient = {
      evaluateOperationSkillScore: async (userId: string, operationLog: string) => {
        if (userId === 'ENG001') {
          return { skillScore: 75, passStatus: 'PASSED' };
        }
        if (userId === 'ENG002') {
          return { skillScore: 65, passStatus: 'FAILED' };
        }
        if (userId === 'ENG003') {
          return { skillScore: 68, passStatus: 'FAILED' };
        }
        if (userId === 'ENG004') {
          return { skillScore: 82, passStatus: 'PASSED' };
        }
        return { skillScore: 0, passStatus: 'UNKNOWN' };
      },
      validateInitialReportData: async (reportContent: string) => {
        return {
          submissionRate: 100,
          dataQualityScore: 85,
          formatUniformityScore: 90,
          isValid: true,
        };
      },
      generateTrainingMaterial: async (targetRole: string) => {
        return {
          materialId: `MAT_${targetRole}_${Date.now()}`,
          title: `Training Material for ${targetRole}`,
          content: 'Sample training content',
          format: 'PDF',
        };
      },
      assessOnboardingApproval: async (analyzeResult: {
        submissionRate: number;
        dataQualityScore: number;
        formatUniformityScore: number;
      }) => {
        const allMetricsPassed =
          analyzeResult.submissionRate >= 90 &&
          analyzeResult.dataQualityScore >= 80 &&
          analyzeResult.formatUniformityScore >= 85;
        return {
          approvalStatus: allMetricsPassed ? 'APPROVED' : 'REJECTED',
          canProceedToProduction: allMetricsPassed,
          feedback: allMetricsPassed ? 'Ready for production' : 'Needs improvement',
        };
      },
      identifyRetrainingCandidates: async (skillEvaluations: Array<{ userId: string; passStatus: string }>) => {
        return skillEvaluations.filter((evaluationValue) => evaluationValue.passStatus === 'FAILED');
      },
    };

    const result = await runTx10Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();
    expect(result.onboardingApprovalStatus).toBeDefined();

    const retrainingCandidates = result.initialReportAnalysis.feedbackItems || [];
    const failedUserIds = retrainingCandidates.map((item: any) => item.userId || item.participantId);

    expect(failedUserIds.length).toBe(2);
    expect(failedUserIds).toContain('ENG002');
    expect(failedUserIds).toContain('ENG003');
    expect(failedUserIds).not.toContain('ENG001');
    expect(failedUserIds).not.toContain('ENG004');
  });
});