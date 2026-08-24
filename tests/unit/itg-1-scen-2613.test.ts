import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 orchestrator', () => {
  // SCEN-2613: [edge] 初回テスト運用判定機能 - データ品質スコアが80点未満のとき本格運用への移行条件を満たさない
  test('should reject production migration when data quality score is below 80 points threshold', async () => {
    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'API障害', frequency: 3, confidence: 0.7 },
          { keyword: 'デプロイ遅延', frequency: 2, confidence: 0.7 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 65,
        severity: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    const trainingMaterials = [
      {
        materialId: 'mat_001',
        title: 'Manager Training Guide',
        contentUrl: 'https://example.com/manager-guide',
        targetRole: 'Manager',
      },
      {
        materialId: 'mat_002',
        title: 'Engineer Training Materials',
        contentUrl: 'https://example.com/engineer-training',
        targetRole: 'Engineer',
      },
    ];

    const participants = [
      { userId: 'eng_001', role: 'Engineer', email: 'eng1@example.com' },
      { userId: 'eng_002', role: 'Engineer', email: 'eng2@example.com' },
      { userId: 'eng_003', role: 'Engineer', email: 'eng3@example.com' },
      { userId: 'eng_004', role: 'Engineer', email: 'eng4@example.com' },
      { userId: 'eng_005', role: 'Engineer', email: 'eng5@example.com' },
      { userId: 'eng_006', role: 'Engineer', email: 'eng6@example.com' },
      { userId: 'eng_007', role: 'Engineer', email: 'eng7@example.com' },
      { userId: 'eng_008', role: 'Engineer', email: 'eng8@example.com' },
      { userId: 'eng_009', role: 'Engineer', email: 'eng9@example.com' },
      { userId: 'eng_010', role: 'Engineer', email: 'eng10@example.com' },
      { userId: 'mgr_001', role: 'Manager', email: 'manager@example.com' },
      { userId: 'pm_001', role: 'ProjectManager', email: 'pm@example.com' },
    ];

    const testReportData = {
      submissionRate: 100,
      totalParticipants: 10,
      submittedCount: 10,
      reports: Array.from({ length: 10 }, (_, i) => ({
        reportId: `report_${i + 1}`,
        userId: participants[i].userId,
        yesterdayCompleted:
          'Completed API integration testing. Resolved 2 bugs related to authentication.',
        todayPlan:
          'Continue integration testing. Start performance optimization for data processing module.',
        challengesDescription:
          'API障害 in staging environment, デプロイ遅延 due to manual approval process.',
        submittedAtTimestamp: new Date('2024-01-15T08:45:00Z'),
      })),
    };

    const input = {
      deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
      participantList: participants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const result = await runTx10Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();
    expect(result.initialReportAnalysis.submissionRate).toBe(100);

    const dataQualityScore = result.initialReportAnalysis.dataQualityScore;
    const formatUniformityScore = result.initialReportAnalysis.formatUniformityScore;
    const calculatedScore =
      (dataQualityScore + formatUniformityScore + result.initialReportAnalysis.submissionRate) /
      3;

    expect(calculatedScore).toBeLessThan(80);
    expect(calculatedScore).toBeCloseTo(76.67, 1);

    expect(result.onboardingApprovalStatus).toBeDefined();
    expect(result.onboardingApprovalStatus.isApproved).toBe(false);

    expect(result.onboardingApprovalStatus.approvalReason).toMatch(/データ品質/);
    expect(result.onboardingApprovalStatus.approvalReason).toMatch(/76\.67|76\.6|77/);
    expect(result.onboardingApprovalStatus.approvalReason).toMatch(/80/);

    expect(result.deploymentSchedule).toBeDefined();
    expect(result.trainingMaterials).toBeDefined();
    expect(result.trainingMaterials.length).toBeGreaterThan(0);
  });
});