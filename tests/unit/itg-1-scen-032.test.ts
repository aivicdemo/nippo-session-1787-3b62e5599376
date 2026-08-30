import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告管理システム - tx-10-imp-1 導入計画統合管理エージェント', () => {
  // SCEN-032: 初回テスト報告入力の品質が運用ルールに不適合な場合、エラーで中断される
  test('initial report quality validation error stops agent execution before manager confirmation', async () => {
    // Setup mock AI client
    const mockAiClient = {
      planAdoptionSchedule: jest.fn().mockResolvedValue({
        scheduleId: 'sched_001',
        startDate: '2025-02-01',
        endDate: '2025-03-15',
        milestones: [
          {
            milestoneName: 'ガイド配信',
            targetDate: '2025-02-03',
          },
          {
            milestoneName: '研修実施',
            targetDate: '2025-02-10',
          },
          {
            milestoneName: '初回報告期限',
            targetDate: '2025-02-17',
          },
          {
            milestoneName: '本運用開始',
            targetDate: '2025-03-15',
          },
        ],
      }),
      conductManagerTraining: jest.fn().mockResolvedValue({
        trainingType: 'manager',
        executionStatus: 'completed',
        completionDate: '2025-02-05',
        participantCount: 1,
      }),
      conductEngineerGroupTraining: jest.fn().mockResolvedValue({
        trainingType: 'engineer_group',
        executionStatus: 'completed',
        completionDate: '2025-02-12',
        participantCount: 2,
        passedCount: 2,
      }),
      evaluateInitialReportSubmission: jest.fn().mockRejectedValue(
        new Error('初回報告データが品質基準を満たしていません。個別再教育とフィードバックが必要です。')
      ),
      sendConfirmationEmailToManager: jest.fn(),
      verifyAdoptionReadiness: jest.fn(),
    };

    const input = {
      participantUserIds: ['user001', 'user002'],
      minimumPreparationDays: 5,
      managerUserId: 'manager001',
      adoptionStartDate: '2025-02-01',
    };

    // Execute and verify error is thrown
    await expect(runTx10Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /初回報告データが品質基準を満たしていません。個別再教育とフィードバックが必要です。/
    );

    // Verify schedule and training were called
    expect(mockAiClient.planAdoptionSchedule).toHaveBeenCalled();
    expect(mockAiClient.conductManagerTraining).toHaveBeenCalled();
    expect(mockAiClient.conductEngineerGroupTraining).toHaveBeenCalled();
    expect(mockAiClient.evaluateInitialReportSubmission).toHaveBeenCalled();

    // Verify manager confirmation and readiness verification were NOT called
    expect(mockAiClient.sendConfirmationEmailToManager).not.toHaveBeenCalled();
    expect(mockAiClient.verifyAdoptionReadiness).not.toHaveBeenCalled();
  });
});