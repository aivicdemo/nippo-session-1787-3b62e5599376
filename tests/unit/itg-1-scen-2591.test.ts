import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-2591
  test('初回報告データ品質評価 - 形式統一度がnullのときエラーをスロー', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const participantList = [
      { userId: 'user001', role: 'ProjectManager', email: 'pm@example.com' },
      { userId: 'user002', role: 'Manager', email: 'mgr@example.com' },
      { userId: 'eng001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng008', role: 'Engineer', email: 'eng008@example.com' },
    ];
    const preparationDaysRequired = 5;
    const reportingDeadlineTime = '09:00';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database', 'API'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveryTimestamp: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue('delivered'),
    };

    const mockAiClient = {
      generateDeploymentSchedule: jest.fn().mockResolvedValue({
        startDate: '2024-01-16',
        phase1Deadline: '2024-01-19',
        phase2Deadline: '2024-01-26',
        productionStartDate: '2024-02-02',
      }),
      generateTrainingMaterials: jest.fn().mockResolvedValue({
        managerGuide: 'Guide content',
        engineerMaterials: ['Material 1', 'Material 2'],
      }),
      analyzeInitialReports: jest.fn().mockResolvedValue({
        submissionRate: 100,
        dataQualityScore: 85,
        formatUniformityScore: null,
        feedbackItems: [
          {
            engineerId: 'eng001',
            feedbackMessage: 'Please provide more details on challenges',
          },
        ],
      }),
      requestOnboardingApproval: jest.fn().mockResolvedValue({
        approvalStatus: 'pending',
        approverComments: 'Reviewing materials',
      }),
    };

    const input = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    await expect(
      runTx10Imp1Agent(input, mockAiClient, {
        textAnalysisAdapter: mockTextAnalysisAdapter,
        notificationAdapter: mockNotificationAdapter,
      })
    ).rejects.toThrow(/形式統一度/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});