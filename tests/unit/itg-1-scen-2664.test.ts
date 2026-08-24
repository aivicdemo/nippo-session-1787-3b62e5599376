import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type DeploymentParticipant } from '../../src/agents/tx-10-imp-1/types';

describe('朝会報告管理システム初期導入・ユーザー教育フロー', () => {
  // SCEN-2664: [edge] 初期導入・ユーザー教育フロー（tx_10）における全員合格判定機能
  test('集合研修参加者全員が合格基準に達した場合、本運用移行フラグが真になる', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList: DeploymentParticipant[] = [
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

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: {},
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 0 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'low' }),
    };

    const mockDatabase = {
      getTrainingResults: jest.fn().mockResolvedValue([
        { userId: 'ENG001', status: 'submitted', dataQualityScore: 85 },
        { userId: 'ENG002', status: 'submitted', dataQualityScore: 82 },
        { userId: 'ENG003', status: 'submitted', dataQualityScore: 88 },
        { userId: 'ENG004', status: 'submitted', dataQualityScore: 80 },
        { userId: 'ENG005', status: 'submitted', dataQualityScore: 90 },
        { userId: 'ENG006', status: 'submitted', dataQualityScore: 83 },
        { userId: 'ENG007', status: 'submitted', dataQualityScore: 86 },
        { userId: 'ENG008', status: 'submitted', dataQualityScore: 81 },
        { userId: 'ENG009', status: 'submitted', dataQualityScore: 87 },
        { userId: 'ENG010', status: 'submitted', dataQualityScore: 84 },
      ]),
      getOnboardingStatus: jest.fn().mockResolvedValue({
        is_operational_migration_ready: false,
      }),
      updateTrainingResultStatus: jest.fn().mockResolvedValue({ updated: true }),
      updateOnboardingReadinessFlag: jest.fn().mockResolvedValue({
        is_operational_migration_ready: true,
      }),
    };

    const output = await runTx10Imp1Agent(input, {
      notificationService: mockNotificationServiceAdapter,
      textAnalysisService: mockTextAnalysisServiceAdapter,
      database: mockDatabase,
    });

    expect(output.onboardingApprovalStatus.is_operational_migration_ready).toBe(
      true
    );

    expect(output.initialReportAnalysis.submissionRate).toBe(100);

    expect(output.initialReportAnalysis.dataQualityScore).toBe(85);

    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(
      85
    );

    expect(mockDatabase.updateOnboardingReadinessFlag).toHaveBeenCalledWith(true);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});