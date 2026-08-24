import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput, DeploymentParticipant, InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('朝会報告管理システム - 部長ダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-2605
  test('初回報告データ品質評価機能 - 形式統一度が84%で基準未達となり改善フェーズへの戻り指示が返る', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList: DeploymentParticipant[] = [
      {
        userId: 'PM001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'MGR001',
        role: 'Manager',
        email: 'mgr@example.com',
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
        keywords: ['リソース不足'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 84,
        confidenceScore: 92,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        classification: 'resource_constraint',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryTimestamp: new Date('2024-01-15T08:05:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-001',
        scheduledTime: new Date('2024-01-15T08:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        deliveryCount: 12,
        failureCount: 0,
      }),
    };

    const agentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const result: Tx10AgentOutput = await runTx10Imp1Agent(agentInput, {
      textAnalysisServiceAdapter: mockTextAnalysisAdapter,
      notificationServiceAdapter: mockNotificationAdapter,
    });

    expect(result).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();

    const analysis: InitialReportAnalysisResult = result.initialReportAnalysis;

    expect(analysis.formatUniformityScore).toBe(84);
    expect(analysis.formatUniformityScore).toBeLessThan(85);

    expect(analysis.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(analysis.dataQualityScore).toBeLessThanOrEqual(100);
    expect(analysis.submissionRate).toBeGreaterThanOrEqual(0);
    expect(analysis.submissionRate).toBeLessThanOrEqual(100);

    expect(analysis.feedbackItems).toBeDefined();
    expect(Array.isArray(analysis.feedbackItems)).toBe(true);
    expect(analysis.feedbackItems.length).toBeGreaterThan(0);

    const feedbackContent = analysis.feedbackItems
      .map((item) => item.feedback?.toLowerCase() || '')
      .join(' ');
    expect(feedbackContent).toMatch(/形式|基準|改善/i);

    expect(result.onboardingApprovalStatus).toBeDefined();
    expect(result.onboardingApprovalStatus.approved).toBe(false);
    expect(result.onboardingApprovalStatus.readyForProduction).toBe(false);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});