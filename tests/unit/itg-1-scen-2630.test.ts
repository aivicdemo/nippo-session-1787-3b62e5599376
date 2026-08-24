import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告管理システム - 再教育対象者抽出', () => {
  // SCEN-2630: [normal] 再教育対象者の抽出 - 再教育対象者が複数人の場合、全員が個別再教育対象として特定される
  test('複数の再教育対象者が全員正確に抽出され、各ユーザーの個別再教育対象フラグがtrueに設定される', async () => {
    // テストデータ: 再教育対象となる複数ユーザー（3名）
    const retrainingTargetUsers = [
      {
        userId: 'user-001',
        role: 'Engineer',
        email: 'engineer001@example.com',
        submissionRate: 50,
        dataQualityScore: 45,
        formatUniformityScore: 60,
      },
      {
        userId: 'user-002',
        role: 'Engineer',
        email: 'engineer002@example.com',
        submissionRate: 60,
        dataQualityScore: 70,
        formatUniformityScore: 55,
      },
      {
        userId: 'user-003',
        role: 'Engineer',
        email: 'engineer003@example.com',
        submissionRate: 65,
        dataQualityScore: 75,
        formatUniformityScore: 80,
      },
    ];

    // 初回テスト報告データ（各ユーザーの報告情報）
    const initialReportAnalysisResult = {
      submissionRate: 60,
      dataQualityScore: 63,
      formatUniformityScore: 65,
      feedbackItems: retrainingTargetUsers.map(user => ({
        userId: user.userId,
        feedbackContent: `${user.userId}は再教育が必要です`,
        requiresRetraining: true,
      })),
    };

    // AIクライアントのスタブ
    const mockAiClient = {
      extractRetrainingTargets: jest.fn().mockResolvedValue({
        retrainingTargets: retrainingTargetUsers.map(user => ({
          userId: user.userId,
          email: user.email,
          reason: 'Data quality or format uniformity below threshold',
          individualized: true,
        })),
        extractionTimestamp: new Date('2024-01-15T10:30:00Z'),
      }),
      generateRetrainingMaterials: jest.fn().mockResolvedValue({
        materialsGenerated: true,
      }),
      notifyRetrainingTargets: jest.fn().mockResolvedValue({
        notificationsSent: 3,
      }),
    };

    // Orchestrator関数を実行
    const result = await runTx10Imp1Agent(
      {
        deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
        participantList: [
          {
            userId: 'user-001',
            role: 'Engineer',
            email: 'engineer001@example.com',
          },
          {
            userId: 'user-002',
            role: 'Engineer',
            email: 'engineer002@example.com',
          },
          {
            userId: 'user-003',
            role: 'Engineer',
            email: 'engineer003@example.com',
          },
          {
            userId: 'pm-001',
            role: 'ProjectManager',
            email: 'pm001@example.com',
          },
          {
            userId: 'mgr-001',
            role: 'Manager',
            email: 'manager001@example.com',
          },
        ],
        preparationDaysRequired: 5,
        reportingDeadlineTime: '09:00',
      },
      mockAiClient,
    );

    // 期待値: 準備した複数の再教育対象者（3名）が全員、戻り値に含まれる
    expect(result.initialReportAnalysis.feedbackItems).toHaveLength(3);

    // 各ユーザーが抽出されたリストに含まれているか確認
    const extractedUserIds = result.initialReportAnalysis.feedbackItems.map(
      item => item.userId,
    );
    expect(extractedUserIds).toContain('user-001');
    expect(extractedUserIds).toContain('user-002');
    expect(extractedUserIds).toContain('user-003');

    // 各ユーザーに対して、『個別再教育対象フラグ』が有効な状態を検証
    result.initialReportAnalysis.feedbackItems.forEach(feedbackItem => {
      expect(feedbackItem.requiresRetraining).toBe(true);
    });

    // 抽出件数が準備したテストデータの再教育対象者数（3件）と一致することを確認
    expect(result.initialReportAnalysis.feedbackItems).toHaveLength(3);

    // AIクライアントの各メソッドが正確に呼ばれたことを検証
    expect(mockAiClient.extractRetrainingTargets).toHaveBeenCalled();
    expect(mockAiClient.generateRetrainingMaterials).toHaveBeenCalled();
    expect(mockAiClient.notifyRetrainingTargets).toHaveBeenCalled();
  });
});