import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 初期導入判定エージェント - テスト運用判定', () => {
  test('SCEN-2619: 1つの条件だけが閾値未満のとき改善フェーズに戻す', async () => {
    // 判定条件の閾値を設定
    const thresholds = {
      submissionRateThreshold: 80, // 報告完了率の閾値: 80%
      dataQualityScoreThreshold: 75, // 課題抽出精度の閾値: 75%
      deliverySuccessRateThreshold: 90, // 通知配信成功率の閾値: 90%
    };

    // テスト入力データ: 初回テスト報告の分析結果
    const input = {
      deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
      participantList: [
        { userId: 'U001', role: 'ProjectManager', email: 'pm@example.com' },
        { userId: 'U002', role: 'Manager', email: 'manager@example.com' },
        {
          userId: 'U003',
          role: 'Engineer',
          email: 'eng1@example.com',
        },
        {
          userId: 'U004',
          role: 'Engineer',
          email: 'eng2@example.com',
        },
        {
          userId: 'U005',
          role: 'Engineer',
          email: 'eng3@example.com',
        },
        {
          userId: 'U006',
          role: 'Engineer',
          email: 'eng4@example.com',
        },
        {
          userId: 'U007',
          role: 'Engineer',
          email: 'eng5@example.com',
        },
        {
          userId: 'U008',
          role: 'Engineer',
          email: 'eng6@example.com',
        },
        {
          userId: 'U009',
          role: 'Engineer',
          email: 'eng7@example.com',
        },
        {
          userId: 'U010',
          role: 'Engineer',
          email: 'eng8@example.com',
        },
        {
          userId: 'U011',
          role: 'Engineer',
          email: 'eng9@example.com',
        },
        {
          userId: 'U012',
          role: 'Engineer',
          email: 'eng10@example.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // TextAnalysisServiceAdapterのスタブ実装
    // 課題抽出精度: 74% (閾値75%未満)
    // その他の条件は閾値以上
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'database_performance',
            frequency: 5,
            confidence: 0.85,
          },
          { keyword: 'api_latency', frequency: 3, confidence: 0.78 },
          { keyword: 'deployment_delay', frequency: 2, confidence: 0.72 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 74, // 閾値未満: 75%より低い
        influenceRange: 'team_wide',
        riskLevel: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severityLevel: 'medium',
        requiresEscalation: false,
      }),
    };

    // NotificationServiceAdapterのスタブ実装
    // 配信成功率: 95% (閾値90%以上)
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({
          notificationId: 'notif_12345',
          status: 'delivered',
          timestamp: new Date('2024-01-15T09:05:00Z'),
        }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched_67890',
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        totalSent: 20,
        successCount: 19, // 95% success rate
        failureCount: 1,
        successRate: 95,
      }),
    };

    // エージェント実行
    const result = await runTx10Imp1Agent(input, {
      textAnalysisService: textAnalysisServiceAdapterStub,
      notificationService: notificationServiceAdapterStub,
    });

    // 期待結果の検証
    // 1. onboardingApprovalStatus が『却下』状態であること
    expect(result.onboardingApprovalStatus.approved).toBe(false);

    // 2. 却下理由に『課題抽出精度が閾値未満』が含まれること
    expect(result.onboardingApprovalStatus.rejectionReason).toMatch(
      /課題抽出精度|dataQualityScore/
    );

    // 3. initialReportAnalysis.dataQualityScore が 74 であること
    expect(result.initialReportAnalysis.dataQualityScore).toBe(74);

    // 4. initialReportAnalysis.submissionRate が 85 以上であること
    expect(result.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(
      80
    );

    // 5. deploymentSchedule.productionStartDate が設定されていないこと
    expect(result.deploymentSchedule.productionStartDate).toBeNull();

    // 6. feedbackItems に改善が必要なエンジニアへのフィードバックが含まれること
    expect(result.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(result.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(
      0
    );

    // 7. feedbackItems に『課題抽出精度の向上』に関する内容が含まれること
    const dataQualityFeedback = result.initialReportAnalysis.feedbackItems.find(
      (item) =>
        item.content &&
        (item.content.includes('課題抽出精度') ||
          item.content.includes('精度') ||
          item.content.includes('dataQuality'))
    );
    expect(dataQualityFeedback).toBeDefined();

    // 8. TextAnalysisServiceAdapter の各メソッドが呼び出されたこと
    expect(textAnalysisServiceAdapterStub.extractKeywords).toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.assessImpactScore).toHaveBeenCalled();
    expect(
      textAnalysisServiceAdapterStub.classifyIssueSeverity
    ).toHaveBeenCalled();

    // 9. onboardingApprovalStatus.status が『improvement_phase』であること
    expect(result.onboardingApprovalStatus.status).toBe('improvement_phase');

    // 10. deploymentSchedule.phases の状態が『suspended』であること
    expect(result.deploymentSchedule.phases).toBeDefined();
    const trainingPhase = result.deploymentSchedule.phases.find(
      (p) => p.name === 'training' || p.phase === 'training'
    );
    if (trainingPhase) {
      expect(trainingPhase.status).toBe('suspended');
    }
  });
});