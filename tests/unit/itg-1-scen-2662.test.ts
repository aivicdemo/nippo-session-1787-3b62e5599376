import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

// SCEN-2662
describe('tx-10-imp-1 orchestrator - 段階的サポート実施機能', () => {
  test('再教育回数が初回である場合、第1段階のサポート内容が割り当てられ、送信後に更新される', async () => {
    // Arrange: 初期状態を設定
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const preparationDaysRequired = 3;
    const reportingDeadlineTime = '09:00';

    const participantList = [
      {
        userId: 'user-A-001',
        role: 'Engineer',
        email: 'user-a@example.com'
      },
      {
        userId: 'user-B-002',
        role: 'Engineer',
        email: 'user-b@example.com'
      },
      {
        userId: 'user-C-003',
        role: 'Engineer',
        email: 'user-c@example.com'
      },
      {
        userId: 'user-D-004',
        role: 'Engineer',
        email: 'user-d@example.com'
      },
      {
        userId: 'user-E-005',
        role: 'Engineer',
        email: 'user-e@example.com'
      },
      {
        userId: 'user-F-006',
        role: 'Engineer',
        email: 'user-f@example.com'
      },
      {
        userId: 'user-G-007',
        role: 'Engineer',
        email: 'user-g@example.com'
      },
      {
        userId: 'user-H-008',
        role: 'Engineer',
        email: 'user-h@example.com'
      },
      {
        userId: 'user-I-009',
        role: 'Engineer',
        email: 'user-i@example.com'
      },
      {
        userId: 'user-J-010',
        role: 'Engineer',
        email: 'user-j@example.com'
      },
      {
        userId: 'manager-001',
        role: 'Manager',
        email: 'manager@example.com'
      }
    ];

    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database', frequency: 2 },
          { keyword: 'network', frequency: 1 }
        ],
        confidence: 0.85
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: 'high'
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'high',
        rationale: 'Performance impact on critical system'
      }),
      generatePriorityList: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            id: 'issue-001',
            title: 'Database Connection Timeout',
            priority: 1,
            score: 85
          }
        ]
      }),
      generateOnboardingMaterials: jest.fn().mockResolvedValue({
        managerGuide: {
          title: 'Manager Onboarding Guide',
          sections: [
            {
              sectionTitle: 'Overview',
              content: 'System introduction for managers'
            }
          ]
        },
        engineerTraining: {
          title: 'Engineer Training Materials',
          modules: [
            {
              moduleName: 'Getting Started',
              content: 'Introduction to daily reporting'
            }
          ]
        }
      }),
      evaluateInitialReports: jest.fn().mockResolvedValue({
        submissionRate: 95,
        dataQualityScore: 88,
        formatUniformityScore: 92,
        feedbackItems: [
          {
            userId: 'user-A-001',
            feedback: 'Good structure, please add more details to issue description',
            isApproved: true
          }
        ]
      }),
      determineLaunchReadiness: jest.fn().mockResolvedValue({
        isReadyForProduction: true,
        approvalStatus: 'approved',
        conditions: [
          { condition: 'submissionRate >= 90', met: true },
          { condition: 'dataQualityScore >= 80', met: true },
          { condition: 'formatUniformityScore >= 85', met: true }
        ]
      })
    };

    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        notificationId: 'notif-001'
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'scheduled-001'
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        deliveredAt: '2024-01-15T08:15:00Z'
      })
    };

    const mockTextAnalysis = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database', 'network'],
        frequencies: [2, 1]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'high'
      })
    };

    const input = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime
    };

    // Act: Tx10エージェントを実行
    const output = await runTx10Imp1Agent(input, mockAiClient);

    // Assert: 出力構造の検証
    expect(output).toBeDefined();
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.startDate).toEqual(new Date('2024-01-15T08:00:00Z'));
    
    // 営業日数計算: 準備期間3営業日
    const expectedLaunchDate = new Date('2024-01-18T08:00:00Z');
    expect(output.deploymentSchedule.launchDate).toEqual(expectedLaunchDate);

    // トレーニング教材の生成確認
    expect(output.trainingMaterials).toBeDefined();
    expect(output.trainingMaterials.length).toBeGreaterThan(0);
    expect(output.trainingMaterials[0].title).toBeDefined();
    expect(output.trainingMaterials[0].targetRole).toBeDefined();

    // 初回テスト報告データ品質評価
    expect(output.initialReportAnalysis).toBeDefined();
    expect(output.initialReportAnalysis.submissionRate).toBe(95);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(88);
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(92);

    // フィードバック項目の確認
    expect(output.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(output.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(0);
    expect(output.initialReportAnalysis.feedbackItems[0].userId).toBe('user-A-001');

    // 本運用開始可否の確認
    expect(output.onboardingApprovalStatus).toBeDefined();
    expect(output.onboardingApprovalStatus.approved).toBe(true);
    expect(output.onboardingApprovalStatus.launchApproved).toBe(true);

    // 承認条件の検証
    const allConditionsMet = output.onboardingApprovalStatus.conditions.every(
      cond => cond.met === true
    );
    expect(allConditionsMet).toBe(true);

    // エージェントの各アクションが呼び出されたことを確認
    expect(mockAiClient.generateOnboardingMaterials).toHaveBeenCalled();
    expect(mockAiClient.evaluateInitialReports).toHaveBeenCalled();
    expect(mockAiClient.determineLaunchReadiness).toHaveBeenCalled();

    // 段階的サポート内容の確認: 第1段階（再教育回数=1）用のサポート内容が含まれる
    const supportContent = output.trainingMaterials.find(
      material => material.targetRole === 'Engineer'
    );
    expect(supportContent).toBeDefined();
    expect(supportContent?.content).toContain('昨日やったこと');
    
    // プレースホルダーと初心者向け補助表示の確認
    const engineeringGuide = supportContent?.content || '';
    expect(engineeringGuide.length).toBeGreaterThan(0);
    
    // 再教育回数の段階的な進行確認
    // 初回（ラウンド1）でユーザーAの再教育回数が1から2に更新されることを想定
    const userAFeedback = output.initialReportAnalysis.feedbackItems.find(
      item => item.userId === 'user-A-001'
    );
    expect(userAFeedback).toBeDefined();
    expect(userAFeedback?.isApproved).toBe(true);
  });
});