import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AdoptionTriggerInput,
  Tx10AdoptionExecutionResult,
  AdoptionScheduleDetail,
  TrainingExecutionStatus,
  InitialReportEvaluationDetail,
  AdoptionReadinessVerificationResult,
  ScheduleMilestone,
  ReportFeedbackItem,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 導入スケジュール自動策定から実行完了までの統合管理', () => {
  // SCEN-029
  test('should complete full adoption cycle with schedule planning, training execution, evaluation, and readiness verification', async () => {
    // Arrange: 入力値の準備
    const participantUserIds = ['user001', 'user002', 'user003'];
    const minimumPreparationDays = 5;
    const managerUserId = 'manager001';
    const adoptionStartDate = '2025-02-10';

    const input: Tx10AdoptionTriggerInput = {
      participantUserIds,
      minimumPreparationDays,
      managerUserId,
      adoptionStartDate,
    };

    // モック: AdoptionScheduleDetail の戻り値
    const mockAdoptionSchedule: AdoptionScheduleDetail = {
      scheduleId: 'schedule_001',
      startDate: '2025-02-10',
      endDate: '2025-03-10',
      milestones: [
        {
          milestoneName: 'ガイド配信',
          targetDate: '2025-02-10',
        },
        {
          milestoneName: '部長研修実施',
          targetDate: '2025-02-12',
        },
        {
          milestoneName: 'エンジニア集合研修',
          targetDate: '2025-02-17',
        },
        {
          milestoneName: '初回報告期限',
          targetDate: '2025-02-24',
        },
        {
          milestoneName: '本運用開始',
          targetDate: '2025-03-10',
        },
      ] as ScheduleMilestone[],
    };

    // モック: TrainingExecutionStatus (部長向け)
    const mockManagerTrainingStatus: TrainingExecutionStatus = {
      trainingType: 'manager',
      executionStatus: 'completed',
      completionDate: '2025-02-12',
      participantCount: 1,
    };

    // モック: TrainingExecutionStatus (エンジニア向け)
    const mockEngineerGroupTrainingStatus: TrainingExecutionStatus = {
      trainingType: 'engineer_group',
      executionStatus: 'completed',
      completionDate: '2025-02-17',
      participantCount: 3,
      passedCount: 3,
    };

    // モック: InitialReportEvaluationDetail
    const mockInitialReportEvaluation: InitialReportEvaluationDetail = {
      evaluationId: 'eval_001',
      totalSubmissions: 3,
      passedSubmissions: 3,
      failedSubmissions: 0,
      feedbackItems: [] as ReportFeedbackItem[],
    };

    // モック: AdoptionReadinessVerificationResult
    const mockAdoptionReadinessVerification: AdoptionReadinessVerificationResult = {
      readinessStatus: 'ready',
      verificationDate: '2025-03-05',
      productionStartDate: '2025-03-10',
    };

    // AI クライアントのスタブ化
    const mockAiClient = {
      planAdoptionSchedule: jest.fn().mockResolvedValue(mockAdoptionSchedule),
      conductManagerTraining: jest.fn().mockResolvedValue(mockManagerTrainingStatus),
      conductEngineerGroupTraining: jest
        .fn()
        .mockResolvedValue(mockEngineerGroupTrainingStatus),
      evaluateInitialReportSubmission: jest
        .fn()
        .mockResolvedValue(mockInitialReportEvaluation),
      verifyAdoptionReadiness: jest
        .fn()
        .mockResolvedValue(mockAdoptionReadinessVerification),
      sendConfirmationEmailToManager: jest.fn().mockResolvedValue({ success: true }),
    };

    // Act: 関数の実行
    const result: Tx10AdoptionExecutionResult = await runTx10Imp1Agent(
      input,
      mockAiClient as any
    );

    // Assert: 戻り値の型と構造を検証
    expect(result).toBeDefined();
    expect(result).toHaveProperty('adoptionSchedule');
    expect(result).toHaveProperty('managerTrainingStatus');
    expect(result).toHaveProperty('engineerGroupTrainingStatus');
    expect(result).toHaveProperty('initialReportEvaluationResult');
    expect(result).toHaveProperty('adoptionReadinessVerification');
    expect(result).toHaveProperty('executionTimestamp');

    // adoptionSchedule の検証
    expect(result.adoptionSchedule.scheduleId).toBe('schedule_001');
    expect(result.adoptionSchedule.startDate).toBe('2025-02-10');
    expect(result.adoptionSchedule.endDate).toBe('2025-03-10');
    expect(result.adoptionSchedule.milestones).toHaveLength(5);
    expect(result.adoptionSchedule.milestones[0].milestoneName).toBe('ガイド配信');
    expect(result.adoptionSchedule.milestones[0].targetDate).toBe('2025-02-10');
    expect(result.adoptionSchedule.milestones[4].milestoneName).toBe('本運用開始');
    expect(result.adoptionSchedule.milestones[4].targetDate).toBe('2025-03-10');

    // managerTrainingStatus の検証
    expect(result.managerTrainingStatus.trainingType).toBe('manager');
    expect(result.managerTrainingStatus.executionStatus).toBe('completed');
    expect(result.managerTrainingStatus.completionDate).toBe('2025-02-12');
    expect(result.managerTrainingStatus.participantCount).toBe(1);

    // engineerGroupTrainingStatus の検証
    expect(result.engineerGroupTrainingStatus.trainingType).toBe('engineer_group');
    expect(result.engineerGroupTrainingStatus.executionStatus).toBe('completed');
    expect(result.engineerGroupTrainingStatus.completionDate).toBe('2025-02-17');
    expect(result.engineerGroupTrainingStatus.participantCount).toBe(3);
    expect(result.engineerGroupTrainingStatus.passedCount).toBe(3);

    // initialReportEvaluationResult の検証
    expect(result.initialReportEvaluationResult.evaluationId).toBe('eval_001');
    expect(result.initialReportEvaluationResult.totalSubmissions).toBe(3);
    expect(result.initialReportEvaluationResult.passedSubmissions).toBe(3);
    expect(result.initialReportEvaluationResult.failedSubmissions).toBe(0);
    expect(result.initialReportEvaluationResult.feedbackItems).toHaveLength(0);

    // adoptionReadinessVerification の検証
    expect(result.adoptionReadinessVerification.readinessStatus).toBe('ready');
    expect(result.adoptionReadinessVerification.verificationDate).toBe('2025-03-05');
    expect(result.adoptionReadinessVerification.productionStartDate).toBe('2025-03-10');

    // executionTimestamp の検証（ISO 8601形式のタイムスタンプ）
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );

    // AI クライアントの各メソッドが1回ずつ呼び出されたことを検証
    expect(mockAiClient.planAdoptionSchedule).toHaveBeenCalledTimes(1);
    expect(mockAiClient.conductManagerTraining).toHaveBeenCalledTimes(1);
    expect(mockAiClient.conductEngineerGroupTraining).toHaveBeenCalledTimes(1);
    expect(mockAiClient.evaluateInitialReportSubmission).toHaveBeenCalledTimes(1);
    expect(mockAiClient.verifyAdoptionReadiness).toHaveBeenCalledTimes(1);
    expect(mockAiClient.sendConfirmationEmailToManager).toHaveBeenCalledTimes(1);
  });
});