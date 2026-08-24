import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: Initial Report Data Quality Assessment', () => {
  // SCEN-2606
  test('should return INCOMPLETE_QUALITY status when submission rate meets threshold but text length and keyword extraction rate fall below requirements', async () => {
    // Setup: Prepare test data with submission rate 95%, average text length 180 chars, keyword extraction rate 60%
    const participants: DeploymentParticipant[] = [
      { userId: 'ENG001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'ENG002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'ENG003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'ENG004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'ENG005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'ENG006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'ENG007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'ENG008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'ENG009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'ENG010', role: 'Engineer', email: 'eng010@example.com' },
    ];

    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'issue1', frequency: 1 },
          { keyword: 'issue2', frequency: 1 },
          { keyword: 'issue3', frequency: 1 },
          { keyword: 'issue4', frequency: 1 },
          { keyword: 'issue5', frequency: 1 },
          { keyword: 'issue6', frequency: 1 },
        ],
        totalKeywordsFound: 6,
        confidenceScore: 0.58,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 45 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'low' }),
    };

    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryId: 'notify-123',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-456',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2026-01-15T09:00:00Z'),
      participantList: participants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const mockInitialReports = [
      {
        userId: 'ENG001',
        yesterdayContent: 'Completed database optimization task. Code review pending.',
        todayContent: 'Start API integration testing.',
        issueContent: 'Database connection pool timeout occasionally occurs.',
      },
      {
        userId: 'ENG002',
        yesterdayContent: 'Fixed login page bugs.',
        todayContent: 'Refactor authentication module.',
        issueContent: 'Memory leak in session handler.',
      },
      {
        userId: 'ENG003',
        yesterdayContent: 'Wrote unit tests for payment service.',
        todayContent: 'Deploy payment service to staging.',
        issueContent: 'Payment gateway API rate limiting.',
      },
      {
        userId: 'ENG004',
        yesterdayContent: 'Reviewed team PRs.',
        todayContent: 'Start QA testing.',
        issueContent: 'Test environment down.',
      },
      {
        userId: 'ENG005',
        yesterdayContent: 'Updated documentation.',
        todayContent: 'Schedule sprint planning.',
        issueContent: 'Documentation tool lag.',
      },
      {
        userId: 'ENG006',
        yesterdayContent: 'Implemented cache layer.',
        todayContent: 'Monitor cache performance.',
        issueContent: 'Cache invalidation logic.',
      },
      {
        userId: 'ENG007',
        yesterdayContent: 'Fixed deployment script.',
        todayContent: 'Run integration tests.',
        issueContent: 'CI/CD pipeline timeout.',
      },
      {
        userId: 'ENG008',
        yesterdayContent: 'Completed security audit.',
        todayContent: 'Address security findings.',
        issueContent: 'SSL certificate expiring soon.',
      },
      {
        userId: 'ENG009',
        yesterdayContent: 'Analyzed performance metrics.',
        todayContent: 'Optimize slow queries.',
        issueContent: 'Query performance regression.',
      },
      // Note: ENG010 intentionally not submitted to achieve 90% submission rate
    ];

    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, {
      textAnalysisService: mockTextAnalysisService,
      notificationService: mockNotificationService,
      mockInitialReports: mockInitialReports,
    } as any);

    // Verification: Check status code and feedback message
    expect(output.initialReportAnalysis.submissionRate).toBe(90);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(68);
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(60);

    expect(output.onboardingApprovalStatus.status).toBe('INCOMPLETE_QUALITY');

    expect(output.onboardingApprovalStatus.feedbackMessage).toMatch(
      /提出率は基準達成/
    );
    expect(output.onboardingApprovalStatus.feedbackMessage).toMatch(
      /平均文字数/
    );
    expect(output.onboardingApprovalStatus.feedbackMessage).toMatch(
      /課題キーワード抽出率/
    );
    expect(output.onboardingApprovalStatus.feedbackMessage).toMatch(
      /改善フェーズ/
    );

    expect(output.onboardingApprovalStatus.canProceedToProduction).toBe(false);

    expect(output.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(
      0
    );
  });
});