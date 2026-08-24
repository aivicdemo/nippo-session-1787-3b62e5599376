import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

// Mock dependencies
jest.mock('../../src/agents/tx-10-imp-1/prompts/action-01', () => ({
  buildAction01Prompt: jest.fn(),
  ACTION_01_PROMPT_VERSION: '1.0.0',
}));
jest.mock('../../src/agents/tx-10-imp-1/prompts/action-02', () => ({
  buildAction02Prompt: jest.fn(),
  ACTION_02_PROMPT_VERSION: '1.0.0',
}));
jest.mock('../../src/agents/tx-10-imp-1/prompts/action-03', () => ({
  buildAction03Prompt: jest.fn(),
  ACTION_03_PROMPT_VERSION: '1.0.0',
}));
jest.mock('../../src/agents/tx-10-imp-1/prompts/action-04', () => ({
  buildAction04Prompt: jest.fn(),
  ACTION_04_PROMPT_VERSION: '1.0.0',
}));
jest.mock('../../src/agents/tx-10-imp-1/prompts/action-05', () => ({
  buildAction05Prompt: jest.fn(),
  ACTION_05_PROMPT_VERSION: '1.0.0',
}));
jest.mock('../../src/agents/tx-10-imp-1/prompts/action-06', () => ({
  buildAction06Prompt: jest.fn(),
  ACTION_06_PROMPT_VERSION: '1.0.0',
}));

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー（tx_10）', () => {
  // SCEN-2665: [edge] 初期導入・ユーザー教育フロー（tx_10）における全員合格判定機能 - 集合研修参加者のうち1名が不合格である場合、本運用移行フラグが偽のままになる
  test('集合研修参加者5名中1名が不合格の場合、本運用移行フラグが偽のままになる', async () => {
    // 初期化
    const deploymentInitiationTimestamp = new Date('2024-11-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';

    // 参加者5名のうち、4名が合格、1名が不合格
    const participantList = [
      {
        userId: 'user-001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'user-002',
        role: 'Manager',
        email: 'manager@example.com',
      },
      {
        userId: 'user-003',
        role: 'Engineer',
        email: 'engineer-001@example.com',
      },
      {
        userId: 'user-004',
        role: 'Engineer',
        email: 'engineer-002@example.com',
      },
      {
        userId: 'user-005',
        role: 'Engineer',
        email: 'engineer-003@example.com',
      },
    ];

    const preparationDaysRequired = 5;

    // モック化されたAIクライアントを定義
    const mockAiClient = {
      generateAction01Response: jest.fn().mockResolvedValue({
        operationSuccessful: true,
        trainingMaterialsGenerated: true,
      }),
      generateAction02Response: jest.fn().mockResolvedValue({
        operationSuccessful: true,
        notificationsSent: 5,
      }),
      generateAction03Response: jest.fn().mockResolvedValue({
        operationSuccessful: true,
        participantScores: [
          { userId: 'user-001', habitationScore: 85 },
          { userId: 'user-002', habitationScore: 88 },
          { userId: 'user-003', habitationScore: 92 },
          { userId: 'user-004', habitationScore: 79 },
          { userId: 'user-005', habitationScore: 65 }, // 不合格: 70未満
        ],
      }),
      generateAction04Response: jest.fn().mockResolvedValue({
        operationSuccessful: true,
        testReportSubmissionRate: 100,
        testReportDataQualityScore: 82,
        testReportFormatUniformityScore: 88,
      }),
      generateAction05Response: jest.fn().mockResolvedValue({
        operationSuccessful: true,
        feedbackItemsGenerated: 1,
        feedbackItems: [
          {
            userId: 'user-005',
            feedbackContent: 'アプリ操作の習熟度が基準に達していません。再実習をお願いします。',
          },
        ],
      }),
      generateAction06Response: jest.fn().mockResolvedValue({
        operationSuccessful: true,
        approvalStatus: 'rejected',
        onboardingApprovalReason:
          '1名の参加者がテスト報告合格基準に達していないため、本運用への移行を見送ります。',
      }),
    };

    // NotificationServiceAdapterをモック化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        deliveryStatus: 'delivered',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        success: true,
        scheduleId: 'schedule-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 5,
        failed: 0,
        pending: 0,
      }),
    };

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: 'テスト', frequency: 3 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    // tx_10エージェントを実行
    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient, {
      notificationServiceAdapter: mockNotificationServiceAdapter,
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
    });

    // 期待結果の検証
    // 1. 初回テスト報告データの品質評価結果を確認
    expect(output.initialReportAnalysis.submissionRate).toBe(100);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(82);
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(88);

    // 2. 不合格フィードバックが1件生成されていることを確認
    expect(output.initialReportAnalysis.feedbackItems.length).toBe(1);
    expect(output.initialReportAnalysis.feedbackItems[0].userId).toBe('user-005');

    // 3. 本運用移行フラグが偽のままであることを確認
    // 4名が90点以上ではなく、1名が不合格（70点未満）のため、
    // 全員合格条件を満たさない場合、本運用移行フラグは偽のまま
    expect(output.onboardingApprovalStatus.approved).toBe(false);
    expect(output.onboardingApprovalStatus.reason).toContain('1名');
    expect(output.onboardingApprovalStatus.readyForProductionDeployment).toBe(false);

    // 4. 部長による承認判定結果が「却下」であることを確認
    expect(output.onboardingApprovalStatus.approvalStatus).toBe('rejected');

    // 5. 導入スケジュールが生成されていることを確認
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.startDate).toBeDefined();
    expect(output.deploymentSchedule.phaseDeadlines).toBeDefined();

    // 6. 研修教材が生成されていることを確認
    expect(output.trainingMaterials).toBeDefined();
    expect(output.trainingMaterials.length).toBeGreaterThan(0);

    // 7. AIクライアントのメソッドが適切に呼び出されたことを確認
    expect(mockAiClient.generateAction03Response).toHaveBeenCalled();
    expect(mockAiClient.generateAction05Response).toHaveBeenCalled();
    expect(mockAiClient.generateAction06Response).toHaveBeenCalled();

    // 8. 全員合格判定機能の動作を確認
    // 参加者5名中1名が不合格のため、全員合格フラグが偽のままになっていることを確認
    const allParticipantsPassedRequirement =
      output.initialReportAnalysis.feedbackItems.length === 0;
    expect(allParticipantsPassedRequirement).toBe(false);

    // 9. 本運用移行の可否判定が、全員合格条件に基づいて正しく判定されていることを確認
    if (!allParticipantsPassedRequirement) {
      expect(output.onboardingApprovalStatus.readyForProductionDeployment).toBe(
        false
      );
    }
  });
});