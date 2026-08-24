import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 朝会報告アプリ初期導入・ユーザー教育 - 初回報告データ評価', () => {
  // SCEN-2582: [normal] 初回報告データ評価機能 - 提出率90%以上・データ品質スコア80点未満・形式統一度85%以上の場合、改善フェーズへの戻し判定が真になる
  test('should return needsReworkPhase=true when submissionRate>=90 AND dataQualityScore<80 AND formatUniformityScore>=85', async () => {
    // テストデータの準備
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    
    const participants: DeploymentParticipant[] = [
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'manager-001',
        role: 'Manager',
        email: 'manager@example.com',
      },
      {
        userId: 'eng-001',
        role: 'Engineer',
        email: 'eng001@example.com',
      },
      {
        userId: 'eng-002',
        role: 'Engineer',
        email: 'eng002@example.com',
      },
      {
        userId: 'eng-003',
        role: 'Engineer',
        email: 'eng003@example.com',
      },
      {
        userId: 'eng-004',
        role: 'Engineer',
        email: 'eng004@example.com',
      },
      {
        userId: 'eng-005',
        role: 'Engineer',
        email: 'eng005@example.com',
      },
      {
        userId: 'eng-006',
        role: 'Engineer',
        email: 'eng006@example.com',
      },
      {
        userId: 'eng-007',
        role: 'Engineer',
        email: 'eng007@example.com',
      },
      {
        userId: 'eng-008',
        role: 'Engineer',
        email: 'eng008@example.com',
      },
      {
        userId: 'eng-009',
        role: 'Engineer',
        email: 'eng009@example.com',
      },
      {
        userId: 'eng-010',
        role: 'Engineer',
        email: 'eng010@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: participants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // NotificationServiceAdapterのモック化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        userId: 'eng-001',
        timestamp: deploymentInitiationTimestamp,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-001',
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 9,
        failed: 0,
        pending: 0,
      }),
    };

    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['課題キーワード1', '課題キーワード2'],
        frequency: [5, 3],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    // エージェントを実行
    const output: Tx10AgentOutput = await runTx10Imp1Agent(
      input,
      {
        notificationService: mockNotificationServiceAdapter,
        textAnalysisService: mockTextAnalysisServiceAdapter,
      } as any,
    );

    // 評価結果の確認
    const analysisResult: InitialReportAnalysisResult = output.initialReportAnalysis;

    // 提出率が90%以上であることを確認（9名/10名 = 90%）
    expect(analysisResult.submissionRate).toBe(90);

    // データ品質スコアが78点（80点未満）であることを確認
    expect(analysisResult.dataQualityScore).toBe(78);

    // 形式統一度スコアが85%以上であることを確認
    expect(analysisResult.formatUniformityScore).toBe(85);

    // 改善フェーズへの戻し判定が真になっていることを確認
    // 条件: (submissionRate >= 90) AND (dataQualityScore < 80) AND (formatUniformityScore >= 85)
    // 実際: (90 >= 90) ✓ AND (78 < 80) ✓ AND (85 >= 85) ✓ = true
    const needsReworkPhase =
      analysisResult.submissionRate >= 90 &&
      analysisResult.dataQualityScore < 80 &&
      analysisResult.formatUniformityScore >= 85;

    expect(needsReworkPhase).toBe(true);

    // オンボーディング承認ステータスが改善フェーズへ戻すことを示しているか確認
    expect(output.onboardingApprovalStatus.canProceedToProduction).toBe(false);
    expect(output.onboardingApprovalStatus.requiresReworkPhase).toBe(true);
  });
});