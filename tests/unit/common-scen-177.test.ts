import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('Tx10Imp1Agent - 導入計画・研修実施・フィードバック対応の自動化・統合', () => {
  // SCEN-177
  test('should complete deployment plan, training materials, and feedback delivery without intermediate human approvals', async () => {
    // Arrange: スタブ AI クライアントを初期化
    const stubAiClient: Tx10Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        version: 'v1.0',
        startDate: new Date('2024-02-01T00:00:00Z'),
        endDate: new Date('2024-02-14T00:00:00Z'),
        phases: [
          {
            phaseName: '導入前準備',
            startDate: new Date('2024-02-01T00:00:00Z'),
            endDate: new Date('2024-02-05T00:00:00Z'),
            description: 'システム準備とアカウント設定',
          },
          {
            phaseName: '部長向け研修',
            startDate: new Date('2024-02-06T00:00:00Z'),
            endDate: new Date('2024-02-07T00:00:00Z'),
            description: '部長向けガイダンス実施',
          },
          {
            phaseName: '全体研修',
            startDate: new Date('2024-02-08T00:00:00Z'),
            endDate: new Date('2024-02-09T00:00:00Z'),
            description: 'エンジニア10名向け集合研修',
          },
          {
            phaseName: 'テスト報告運用',
            startDate: new Date('2024-02-10T00:00:00Z'),
            endDate: new Date('2024-02-12T00:00:00Z'),
            description: '初回テスト報告収集・評価',
          },
          {
            phaseName: '本運用開始準備',
            startDate: new Date('2024-02-13T00:00:00Z'),
            endDate: new Date('2024-02-14T00:00:00Z'),
            description: 'フィードバック配信・本運用開始',
          },
        ],
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue({
        version: 'v1.0',
        managerGuideMaterial: {
          title: '朝会報告管理システム 部長向け操作ガイド',
          sections: [
            {
              sectionTitle: 'システム概要',
              content: 'システムの目的と利用方法を説明',
            },
            {
              sectionTitle: '日報管理機能',
              content: 'メンバーの報告収集と確認方法',
            },
            {
              sectionTitle: '課題優先度判定',
              content: 'AIによる優先度自動判定と部長による確認プロセス',
            },
          ],
        },
        operationRuleMaterial: {
          title: '朝会報告管理システム 運用ルール説明書',
          sections: [
            {
              ruleName: '日報提出期限',
              rule: '毎日09:00',
            },
            {
              ruleName: 'リマインド送信タイミング',
              rule: 'T-1日18:00と当日08:30',
            },
            {
              ruleName: '課題優先度レベル',
              rule: '高・中・低の3段階',
            },
          ],
        },
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue({
        version: 'v1.0',
        trainingMaterials: [
          {
            materialTitle: 'システム基本操作研修テキスト',
            targetAudience: 'エンジニア',
            sections: [
              {
                topicName: 'ログインと初期設定',
                content: 'システムへのアクセス方法',
              },
              {
                topicName: '日報入力フロー',
                content: '3要素（昨日やったこと・今日やること・課題）の入力方法',
              },
              {
                topicName: '課題抽出と優先度確認',
                content: 'AIによる課題抽出結果の確認方法',
              },
            ],
          },
        ],
        trainingSchedule: {
          trainingDate: new Date('2024-02-08T09:00:00Z'),
          duration: 120,
          location: '会議室A',
          targetParticipantCount: 10,
        },
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue({
        version: 'v1.0',
        collectedReports: [
          {
            reportId: 'REPORT001',
            memberId: 'ENG001',
            memberName: 'Engineer A',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T08:30:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Feature A implementation completed',
              todayPlan: 'Code review and Feature B start',
              currentChallenges: 'Database performance issue',
            },
            completenessScore: 100,
            clarityScore: 95,
          },
          {
            reportId: 'REPORT002',
            memberId: 'ENG002',
            memberName: 'Engineer B',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T08:45:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Bug fix in module X',
              todayPlan: 'Integration testing',
              currentChallenges: 'Test environment setup',
            },
            completenessScore: 100,
            clarityScore: 92,
          },
          {
            reportId: 'REPORT003',
            memberId: 'ENG003',
            memberName: 'Engineer C',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T08:50:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Documentation update',
              todayPlan: 'API endpoint development',
              currentChallenges: 'Third-party API limitation',
            },
            completenessScore: 100,
            clarityScore: 90,
          },
          {
            reportId: 'REPORT004',
            memberId: 'ENG004',
            memberName: 'Engineer D',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T09:00:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Performance optimization',
              todayPlan: 'Monitoring setup',
              currentChallenges: 'Server resource constraint',
            },
            completenessScore: 100,
            clarityScore: 94,
          },
          {
            reportId: 'REPORT005',
            memberId: 'ENG005',
            memberName: 'Engineer E',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T09:05:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Unit test development',
              todayPlan: 'Integration test execution',
              currentChallenges: 'Test data preparation',
            },
            completenessScore: 100,
            clarityScore: 93,
          },
          {
            reportId: 'REPORT006',
            memberId: 'ENG006',
            memberName: 'Engineer F',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T09:10:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Security audit completion',
              todayPlan: 'Vulnerability remediation',
              currentChallenges: 'SSL certificate update',
            },
            completenessScore: 100,
            clarityScore: 96,
          },
          {
            reportId: 'REPORT007',
            memberId: 'ENG007',
            memberName: 'Engineer G',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T09:15:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Architecture review',
              todayPlan: 'Refactoring planning',
              currentChallenges: 'Legacy system dependency',
            },
            completenessScore: 100,
            clarityScore: 91,
          },
          {
            reportId: 'REPORT008',
            memberId: 'ENG008',
            memberName: 'Engineer H',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T09:20:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'System deployment',
              todayPlan: 'Production monitoring',
              currentChallenges: 'Alert configuration',
            },
            completenessScore: 100,
            clarityScore: 89,
          },
          {
            reportId: 'REPORT009',
            memberId: 'ENG009',
            memberName: 'Engineer I',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T09:25:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Backup system validation',
              todayPlan: 'Disaster recovery test',
              currentChallenges: 'Recovery time objective',
            },
            completenessScore: 100,
            clarityScore: 88,
          },
          {
            reportId: 'REPORT010',
            memberId: 'ENG010',
            memberName: 'Engineer J',
            submissionStatus: 'submitted',
            submissionTimestamp: new Date('2024-02-10T09:30:00Z'),
            reportContent: {
              yesterdayAccomplishments: 'Capacity planning',
              todayPlan: 'Scalability assessment',
              currentChallenges: 'Infrastructure cost optimization',
            },
            completenessScore: 100,
            clarityScore: 87,
          },
        ],
        analysisMetrics: {
          submissionRate: 100,
          averageCompletenessScore: 100,
          averageClarityScore: 91.5,
        },
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue({
        version: 'v1.0',
        proficiencyAssessments: [
          {
            memberId: 'ENG001',
            memberName: 'Engineer A',
            proficiencyLevel: 'Advanced',
            proficiencyScore: 95,
            feedbackItems: [],
          },
          {
            memberId: 'ENG002',
            memberName: 'Engineer B',
            proficiencyLevel: 'Proficient',
            proficiencyScore: 88,
            feedbackItems: [],
          },
          {
            memberId: 'ENG003',
            memberName: 'Engineer C',
            proficiencyLevel: 'Proficient',
            proficiencyScore: 85,
            feedbackItems: [
              {
                feedbackType: 'Suggestion',
                content: 'Consider adding more specific timeline in "todayPlan"',
              },
            ],
          },
          {
            memberId: 'ENG004',
            memberName: 'Engineer D',
            proficiencyLevel: 'Proficient',
            proficiencyScore: 90,
            feedbackItems: [],
          },
          {
            memberId: 'ENG005',
            memberName: 'Engineer E',
            proficiencyLevel: 'Proficient',
            proficiencyScore: 86,
            feedbackItems: [
              {
                feedbackType: 'Suggestion',
                content: 'Quantify test data volume requirements',
              },
            ],
          },
          {
            memberId: 'ENG006',
            memberName: 'Engineer F',
            proficiencyLevel: 'Advanced',
            proficiencyScore: 93,
            feedbackItems: [],
          },
          {
            memberId: 'ENG007',
            memberName: 'Engineer G',
            proficiencyLevel: 'Proficient',
            proficiencyScore: 84,
            feedbackItems: [
              {
                feedbackType: 'Suggestion',
                content: 'Add estimated effort for refactoring tasks',
              },
            ],
          },
          {
            memberId: 'ENG008',
            memberName: 'Engineer H',
            proficiencyLevel: 'Proficient',
            proficiencyScore: 82,
            feedbackItems: [
              {
                feedbackType: 'Suggestion',
                content: 'Describe alert thresholds and escalation procedures',
              },
            ],
          },
          {
            memberId: 'ENG009',
            memberName: 'Engineer I',
            proficiencyLevel: 'Proficient',
            proficiencyScore: 80,
            feedbackItems: [
              {
                feedbackType: 'Suggestion',
                content: 'Include specific RTO and RPO targets',
              },
            ],
          },
          {
            memberId: 'ENG010',
            memberName: 'Engineer J',
            proficiencyLevel: 'Developing',
            proficiencyScore: 78,
            feedbackItems: [
              {
                feedbackType: 'Guidance',
                content: 'Provide cost breakdown for infrastructure options',
              },
            ],
          },
        ],
        feedbackProposals: [
          {
            feedbackId: 'FB001',
            targetMemberId: 'ENG003',
            targetMemberName: 'Engineer C',
            feedbackContent: 'Consider adding more specific timeline in "todayPlan"',
            feedbackCategory: 'ReportQuality',
            priority: 'Medium',
          },
          {
            feedbackId: 'FB002',
            targetMemberId: 'ENG005',
            targetMemberName: 'Engineer E',
            feedbackContent: 'Quantify test data volume requirements',
            feedbackCategory: 'ReportQuality',
            priority: 'Medium',
          },
          {
            feedbackId: 'FB003',
            targetMemberId: 'ENG007',
            targetMemberName: 'Engineer G',
            feedbackContent: 'Add estimated effort for refactoring tasks',
            feedbackCategory: 'ReportQuality',
            priority: 'Medium',
          },
          {
            feedbackId: 'FB004',
            targetMemberId: 'ENG008',
            targetMemberName: 'Engineer H',
            feedbackContent: 'Describe alert thresholds and escalation procedures',
            feedbackCategory: 'ReportQuality',
            priority: 'Medium',
          },
          {
            feedbackId: 'FB005',
            targetMemberId: 'ENG009',
            targetMemberName: 'Engineer I',
            feedbackContent: 'Include specific RTO and RPO targets',
            feedbackCategory: 'ReportQuality',
            priority: 'Medium',
          },
          {
            feedbackId: 'FB006',
            targetMemberId: 'ENG010',
            targetMemberName: 'Engineer J',
            feedbackContent: 'Provide cost breakdown for infrastructure options',
            feedbackCategory: 'Guidance',
            priority: 'High',
          },
        ],
      }),
      buildAction06Prompt: jest.fn().mockResolvedValue({
        version: 'v1.0',
        distributionEvents: [
          {
            deliveryEventId: 'DEL001',
            targetMemberId: 'ENG001',
            targetMemberName: 'Engineer A',
            feedbackContent: '',
            distributionTimestamp: new Date('2024-02-13T10:00:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL002',
            targetMemberId: 'ENG002',
            targetMemberName: 'Engineer B',
            feedbackContent: '',
            distributionTimestamp: new Date('2024-02-13T10:01:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL003',
            targetMemberId: 'ENG003',
            targetMemberName: 'Engineer C',
            feedbackContent: 'Consider adding more specific timeline in "todayPlan"',
            distributionTimestamp: new Date('2024-02-13T10:02:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL004',
            targetMemberId: 'ENG004',
            targetMemberName: 'Engineer D',
            feedbackContent: '',
            distributionTimestamp: new Date('2024-02-13T10:03:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL005',
            targetMemberId: 'ENG005',
            targetMemberName: 'Engineer E',
            feedbackContent: 'Quantify test data volume requirements',
            distributionTimestamp: new Date('2024-02-13T10:04:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL006',
            targetMemberId: 'ENG006',
            targetMemberName: 'Engineer F',
            feedbackContent: '',
            distributionTimestamp: new Date('2024-02-13T10:05:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL007',
            targetMemberId: 'ENG007',
            targetMemberName: 'Engineer G',
            feedbackContent: 'Add estimated effort for refactoring tasks',
            distributionTimestamp: new Date('2024-02-13T10:06:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL008',
            targetMemberId: 'ENG008',
            targetMemberName: 'Engineer H',
            feedbackContent: 'Describe alert thresholds and escalation procedures',
            distributionTimestamp: new Date('2024-02-13T10:07:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL009',
            targetMemberId: 'ENG009',
            targetMemberName: 'Engineer I',
            feedbackContent: 'Include specific RTO and RPO targets',
            distributionTimestamp: new Date('2024-02-13T10:08:00Z'),
            deliveryStatus: 'Success',
          },
          {
            deliveryEventId: 'DEL010',
            targetMemberId: 'ENG010',
            targetMemberName: 'Engineer J',
            feedbackContent: 'Provide cost breakdown for infrastructure options',
            distributionTimestamp: new Date('2024-02-13T10:09:00Z'),
            deliveryStatus: 'Success',
          },
        ],
      }),
    };

    // テスト入力データ
    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-02-01T00:00:00Z'),
      participantList: [
        { userId: 'ENG001', role: 'Engineer', email: 'eng001@company.com' },
        { userId: 'ENG002', role: 'Engineer', email: 'eng002@company.com' },
        { userId: 'ENG003', role: 'Engineer', email: 'eng003@company.com' },
        { userId: 'ENG004', role: 'Engineer', email: 'eng004@company.com' },
        { userId: 'ENG005', role: 'Engineer', email: 'eng005@company.com' },
        { userId: 'ENG006', role: 'Engineer', email: 'eng006@company.com' },
        { userId: 'ENG007', role: 'Engineer', email: 'eng007@company.com' },
        { userId: 'ENG008', role: 'Engineer', email: 'eng008@company.com' },
        { userId: 'ENG009', role: 'Engineer', email: 'eng009@company.com' },
        { userId: 'ENG010', role: 'Engineer', email: 'eng010@company.com' },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // Act: オーケストレーター関数を実行
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, stubAiClient);

    // Assert
    // (1) 導入スケジュール案がエンジニア部10名規模に対して自動生成されることを検証
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.startDate).toEqual(new Date('2024-02-01T00:00:00Z'));
    expect(output.deploymentSchedule.endDate).toEqual(new Date('2024-02-14T00:00:00Z'));
    expect(output.deploymentSchedule.phases).toHaveLength(5);
    expect(output.deploymentSchedule.phases[0].phaseName).toBe('導入前準備');
    expect(output.deploymentSchedule.phases[1].phaseName).toBe('部長向け研修');
    expect(output.deploymentSchedule.phases[2].phaseName).toBe('全体研修');
    expect(output.deploymentSchedule.phases[3].phaseName).toBe('テスト報告運用');
    expect(output.deploymentSchedule.phases[4].phaseName).toBe('本運用開始準備');

    // (2) 部長向け操作ガイドと全エンジニア向け集合研修教材が自動作成されることを検証
    expect(output.trainingMaterials).toBeDefined();
    expect(output.trainingMaterials).toHaveLength(1);
    expect(output.trainingMaterials[0].materialTitle).toBe('システム基本操作研修テキスト');
    expect(output.trainingMaterials[0].targetAudience).toBe('エンジニア');
    expect(output.trainingMaterials[0].sections).toHaveLength(3);

    // (3) 初回報告データ10件が収集され、3つの報告要素の完全性で評価されることを検証
    expect(output.initialReportAnalysis).toBeDefined();
    expect(output.initialReportAnalysis.submissionRate).toBe(100);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(100);
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(91.5);

    // (4) メンバー別習熟度と課題が自動判定されることを検証
    expect(output.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(output.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(0);
    expect(output.initialReportAnalysis.feedbackItems.length).toBeLessThanOrEqual(10);

    // (5) フィードバック案が妥当性基準内で生成されることを検証
    const feedbackCountByPriority = output.initialReportAnalysis.feedbackItems.reduce(
      (acc, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    expect(feedbackCountByPriority['High'] || 0).toBeLessThanOrEqual(2);
    expect(feedbackCountByPriority['Medium'] || 0).toBeLessThanOrEqual(8);

    // (6) フィードバック内容が10名全メンバーに自動配信されることを検証
    expect(output.onboardingApprovalStatus).toBeDefined();
    expect(output.onboardingApprovalStatus.status).toBe('完了');
    expect(output.onboardingApprovalStatus.distributionSuccessCount).toBe(10);
    expect(output.onboardingApprovalStatus.distributionFailureCount).toBe(0);

    // 追加検証
    // 人の都度承認回数は0回であることを検証
    expect(output.onboardingApprovalStatus.humanApprovalRequiredCount).toBe(0);

    // エスカレーション条件は発生していないことを検証
    expect(output.onboardingApprovalStatus.escalationTriggered).toBe(false);

    // すべてのAction実行履歴は監査ログに記録されていることを検証
    expect(output.onboardingApprovalStatus.auditLog).toBeDefined();
    expect(output.onboardingApprovalStatus.auditLog.length).toBeGreaterThanOrEqual(6);
    expect(output.onboardingApprovalStatus.auditLog.some((log) => log.actionId === 'Action01')).toBe(true);
    expect(output.onboardingApprovalStatus.auditLog.some((log) => log.actionId === 'Action02')).toBe(true);
    expect(output.onboardingApprovalStatus.auditLog.some((log) => log.actionId === 'Action03')).toBe(true);
    expect(output.onboardingApprovalStatus.auditLog.some((log) => log.actionId === 'Action04')).toBe(true);
    expect(output.onboardingApprovalStatus.auditLog.some((log) => log.actionId === 'Action05')).toBe(true);
    expect(output.onboardingApprovalStatus.auditLog.some((log) => log.actionId === 'Action06')).toBe(true);

    // すべてのアクション実行が成功していることを検証
    const allActionsSucceeded = output.onboardingApprovalStatus.auditLog.every(
      (log) => log.executionStatus === 'Success'
    );
    expect(allActionsSucceeded).toBe(true);

    // 導入完了予定日がスケジュール終了日に一致することを検証
    expect(output.onboardingApprovalStatus.targetLiveStartDate).toEqual(output.deploymentSchedule.endDate);
  });
});