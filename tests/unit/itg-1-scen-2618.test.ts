import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant } from '../../src/agents/tx-10-imp-1/types';

describe('Initial deployment phase - production readiness evaluation', () => {
  // SCEN-2618: [edge] 初回テスト運用判定機能 - 3条件すべてがちょうど閾値を満たすとき本格運用へ移行
  test('should transition to production when all 3 readiness conditions exactly meet thresholds', async () => {
    // Arrange: 初回運用判定機能の前提条件を設定
    const deploymentStartTime = new Date('2025-03-10T09:00:00Z');
    const participantList: DeploymentParticipant[] = [
      { userId: 'eng001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'eng009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'eng010', role: 'Engineer', email: 'eng010@example.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: deploymentStartTime,
      participantList: participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // TextAnalysisServiceAdapterのスタブ設定: 課題抽出成功率100%
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['Database Connection Issue', 'API Response Timeout'],
        frequency: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: 'HIGH',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'HIGH',
        confidence: 0.95,
      }),
    };

    // NotificationServiceAdapterのスタブ設定: 通知配信成功率100%
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'SUCCESS',
        deliveredAt: new Date('2025-03-10T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched_001',
        scheduledTime: new Date('2025-03-10T08:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'DELIVERED',
        successCount: 10,
        failureCount: 0,
      }),
    };

    // 初回テスト報告の状態を構成: 提出率100%、データ品質80点以上、形式統一度85%以上
    const initialReportData = {
      submissionRate: 100, // 条件1: 部員報告提出率 = 100%（10名全員が日報を送信完了）
      dataQualityScore: 80, // データ品質スコア = ちょうど80点
      formatUniformityScore: 85, // 形式統一度スコア = ちょうど85%
    };

    // Act: 運用判定ロジック関数を呼び出す
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, {
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
      notificationServiceAdapter: mockNotificationServiceAdapter,
      initialReportData: initialReportData,
    });

    // Assert: 運用判定結果が「本格運用へ移行」と判定されていることを確認
    expect(output.onboardingApprovalStatus.approvalStatus).toBe('APPROVED_FOR_PRODUCTION');
    expect(output.onboardingApprovalStatus.readinessEvaluation.condition1SubmissionRate).toBe(100);
    expect(output.onboardingApprovalStatus.readinessEvaluation.condition2KeywordExtractionSuccessRate).toBe(100);
    expect(output.onboardingApprovalStatus.readinessEvaluation.condition3NotificationDeliverySuccessRate).toBe(100);

    // データベースの運用判定履歴に正しく記録されていることを確認
    expect(output.onboardingApprovalStatus.evaluationTimestamp).toEqual(expect.any(Date));
    expect(output.onboardingApprovalStatus.readinessEvaluation.allConditionsMet).toBe(true);
    expect(output.onboardingApprovalStatus.readinessEvaluation.condition1SubmissionRate).toBeGreaterThanOrEqual(90);
    expect(output.onboardingApprovalStatus.readinessEvaluation.condition2KeywordExtractionSuccessRate).toBeGreaterThanOrEqual(100);
    expect(output.onboardingApprovalStatus.readinessEvaluation.condition3NotificationDeliverySuccessRate).toBeGreaterThanOrEqual(100);

    // スケジュール、研修資料、初回テスト分析結果も生成されていることを確認
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.productionStartDate).toBeDefined();
    expect(output.trainingMaterials).toBeDefined();
    expect(output.trainingMaterials.length).toBeGreaterThan(0);
    expect(output.initialReportAnalysis).toBeDefined();
    expect(output.initialReportAnalysis.submissionRate).toBe(100);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(80);
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(85);
  });
});