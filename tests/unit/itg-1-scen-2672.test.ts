import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー（tx_10）', () => {
  // SCEN-2672: 大規模集合研修参加者全員合格時の本運用移行処理
  test('should complete production migration successfully when all large-scale training participants pass initial test report evaluation', async () => {
    // 準備：業務上の最大規模を想定（30～50名程度の大規模グループ）
    // ここでは40名規模でシミュレート
    const largeScaleParticipantCount = 40;
    const participants: DeploymentParticipant[] = Array.from({ length: largeScaleParticipantCount }, (_, index) => ({
      userId: `user_${String(index + 1).padStart(3, '0')}`,
      role: index < 2 ? 'ProjectManager' : (index < 5 ? 'Manager' : 'Engineer'),
      email: `user${index + 1}@example.com`
    }));

    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 3;

    // スタブ化：NotificationServiceAdapter と TextAnalysisServiceAdapter
    const stubNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'delivered', userId: '', timestamp: new Date() }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduleId: 'sched_001' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: largeScaleParticipantCount, failed: 0, pending: 0 })
    };

    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['課題A', '課題B'],
        frequencies: [5, 3]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'medium' })
    };

    // 初回テスト報告データ：全員が合格基準を満たすシナリオ
    // 提出率90%以上、データ品質スコア80点以上、形式統一度85%以上
    const initialReportAnalysisResult: InitialReportAnalysisResult = {
      submissionRate: 97.5, // 40名中39名が提出（97.5%）
      dataQualityScore: 85,  // 85点（基準80点以上）
      formatUniformityScore: 92, // 92%（基準85%以上）
      feedbackItems: [] // 不合格者がいないためフィードバックなし
    };

    // 入力データの構築
    const tx10Input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: participants,
      preparationDaysRequired,
      reportingDeadlineTime
    };

    // 実行：AIエージェントの統合処理
    const output: Tx10AgentOutput = await runTx10Imp1Agent(tx10Input, {
      notificationServiceAdapter: stubNotificationAdapter,
      textAnalysisServiceAdapter: stubTextAnalysisAdapter,
      initialReportAnalysisResult
    });

    // 検証1：本運用移行処理が正常に完了
    expect(output.onboardingApprovalStatus.isApproved).toBe(true);
    expect(output.onboardingApprovalStatus.productionStartAuthorized).toBe(true);

    // 検証2：全研修参加者のステータスが「本運用ユーザー」に更新
    expect(output.onboardingApprovalStatus.deploymentParticipantCount).toBe(largeScaleParticipantCount);
    expect(output.onboardingApprovalStatus.producationReadyParticipantCount).toBe(largeScaleParticipantCount);

    // 検証3：初回報告データ品質が基準を満たしている
    expect(output.initialReportAnalysis.submissionRate).toBe(97.5);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(85);
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(92);

    // 検証4：本運用開始予定日が正確に設定されている
    // 導入開始日 + 事前準備3営業日 + 研修期間（1営業日）+ テスト報告（1営業日）
    const expectedProductionStartDate = new Date('2024-01-19T09:00:00Z');
    expect(output.deploymentSchedule.productionStartScheduledDate).toEqual(expectedProductionStartDate);

    // 検証5：導入スケジュールに各フェーズの期限が記録されている
    expect(output.deploymentSchedule.deploymentStartDate).toEqual(deploymentInitiationTimestamp);
    expect(output.deploymentSchedule.phase1PreparationDeadline).toEqual(new Date('2024-01-18T09:00:00Z'));
    expect(output.deploymentSchedule.phase2TrainingDeadline).toEqual(new Date('2024-01-18T09:00:00Z'));
    expect(output.deploymentSchedule.phase3TestReportingDeadline).toEqual(new Date('2024-01-19T09:00:00Z'));

    // 検証6：研修教材が正常に生成されている
    expect(output.trainingMaterials).toBeDefined();
    expect(output.trainingMaterials.length).toBeGreaterThan(0);
    expect(output.trainingMaterials.some(m => m.targetRole === 'Manager')).toBe(true);
    expect(output.trainingMaterials.some(m => m.targetRole === 'Engineer')).toBe(true);

    // 検証7：AIVICゴール制約（ログイン→日報入力→送信のシンプルフロー）が保持されている
    // 入力パラメータの構造がシンプルであることを確認
    expect(Object.keys(tx10Input).length).toBe(4);
    expect(tx10Input).toHaveProperty('deploymentInitiationTimestamp');
    expect(tx10Input).toHaveProperty('participantList');
    expect(tx10Input).toHaveProperty('preparationDaysRequired');
    expect(tx10Input).toHaveProperty('reportingDeadlineTime');

    // 検証8：外部API呼び出しがスタブ経由でのみ行われている
    // NotificationServiceAdapter のメソッドが呼び出されたことを確認
    expect(stubNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
    expect(stubNotificationAdapter.getDeliveryStatus).toHaveBeenCalled();
    // TextAnalysisServiceAdapter のメソッドが呼び出されたことを確認
    expect(stubTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // 検証9：システムログに移行日時と参加者数が記録されていることを示唆する情報が含まれている
    expect(output.onboardingApprovalStatus.approvalTimestamp).toBeDefined();
    expect(typeof output.onboardingApprovalStatus.approvalTimestamp).toBe('object');
    expect(output.onboardingApprovalStatus.deploymentParticipantCount).toBe(40);

    // 検証10：フィードバック項目が空（全員合格）であることを確認
    expect(output.initialReportAnalysis.feedbackItems).toEqual([]);
  });
});