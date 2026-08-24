import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1: 朝会報告アプリ初期導入・ユーザー教育 - 初回報告データ品質評価', () => {
  // SCEN-2607
  test('初回報告データ品質評価機能 - データ品質スコアは80点以上だが他2条件が未達で改善フェーズへの戻り指示が返る', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList = [
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

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database_performance', 'api_latency'],
        frequency: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 85,
        severity: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'medium',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        deliveryStatus: 'delivered',
      }),
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const output = await runTx10Imp1Agent(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    });

    expect(output).toHaveProperty('initialReportAnalysis');
    expect(output.initialReportAnalysis).toHaveProperty('dataQualityScore');
    expect(output.initialReportAnalysis.dataQualityScore).toBe(85);
    expect(output.initialReportAnalysis).toHaveProperty('submissionRate');
    expect(output.initialReportAnalysis).toHaveProperty('formatUniformityScore');
    expect(output.initialReportAnalysis).toHaveProperty('feedbackItems');

    expect(output.initialReportAnalysis.submissionRate).toBeLessThan(90);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeLessThan(85);

    expect(Array.isArray(output.initialReportAnalysis.feedbackItems)).toBe(true);
    expect(output.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(0);

    const completenessIssue = output.initialReportAnalysis.feedbackItems.find(
      (item) => item.issue === 'completeness' || item.message.includes('complete')
    );
    const clarityIssue = output.initialReportAnalysis.feedbackItems.find(
      (item) => item.issue === 'clarity' || item.message.includes('clear')
    );

    expect(completenessIssue).toBeDefined();
    expect(clarityIssue).toBeDefined();

    expect(output.onboardingApprovalStatus).toHaveProperty('isApproved');
    expect(output.onboardingApprovalStatus.isApproved).toBe(false);
    expect(output.onboardingApprovalStatus).toHaveProperty('reason');
    expect(
      output.onboardingApprovalStatus.reason.includes('completeness') ||
        output.onboardingApprovalStatus.reason.includes('clarity')
    ).toBe(true);

    expect(output).toHaveProperty('trainingMaterials');
    expect(Array.isArray(output.trainingMaterials)).toBe(true);

    expect(output).toHaveProperty('deploymentSchedule');
    expect(output.deploymentSchedule).toHaveProperty('startDate');
    expect(output.deploymentSchedule).toHaveProperty('phaseDeadlines');
    expect(output.deploymentSchedule).toHaveProperty('productionStartDate');
  });
});