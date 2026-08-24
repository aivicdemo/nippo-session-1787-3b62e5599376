import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('TX-10 初期導入・ユーザー教育フロー - 初回報告データ評価機能', () => {
  // SCEN-2584
  test('同じ報告データセットに対して2回連続で評価実行した場合、同じ移行判定結果が得られる', async () => {
    // 固定値のテスト用データセット
    const testDeploymentTimestamp = new Date('2024-01-15T08:00:00Z');
    const testParticipants = [
      {
        userId: 'user001',
        role: 'Engineer',
        email: 'engineer001@example.com',
      },
      {
        userId: 'user002',
        role: 'Engineer',
        email: 'engineer002@example.com',
      },
      {
        userId: 'user003',
        role: 'Engineer',
        email: 'engineer003@example.com',
      },
      {
        userId: 'user004',
        role: 'Engineer',
        email: 'engineer004@example.com',
      },
      {
        userId: 'user005',
        role: 'Engineer',
        email: 'engineer005@example.com',
      },
      {
        userId: 'user006',
        role: 'Engineer',
        email: 'engineer006@example.com',
      },
      {
        userId: 'user007',
        role: 'Engineer',
        email: 'engineer007@example.com',
      },
      {
        userId: 'user008',
        role: 'Engineer',
        email: 'engineer008@example.com',
      },
      {
        userId: 'user009',
        role: 'Engineer',
        email: 'engineer009@example.com',
      },
      {
        userId: 'user010',
        role: 'Engineer',
        email: 'engineer010@example.com',
      },
      {
        userId: 'pm001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'manager001',
        role: 'Manager',
        email: 'manager@example.com',
      },
    ];

    const testInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: testDeploymentTimestamp,
      participantList: testParticipants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // テスト用の初回報告データ
    const initialReportData = {
      yesterday: 'バグ修正',
      today: '機能開発',
      issues: 'パフォーマンス問題',
    };

    // モック化されたTextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        return {
          keywords: ['パフォーマンス', '問題'],
          frequency: [3, 2],
        };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        const scoreMap: Record<string, number> = {
          'パフォーマンス': 75,
          '問題': 60,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn(async (issueText: string) => {
        if (issueText.includes('パフォーマンス')) {
          return '高';
        }
        return '中';
      }),
    };

    // モック化されたNotificationServiceAdapter
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        return { status: 'success', deliveredAt: new Date('2024-01-15T08:30:00Z') };
      }),
      scheduleNotification: jest.fn(async (userId: string, scheduledTime: Date, message: string) => {
        return { status: 'scheduled', scheduledAt: scheduledTime };
      }),
      getDeliveryStatus: jest.fn(async (userId: string) => {
        return { status: 'delivered', count: 1 };
      }),
    };

    // 初回評価実行
    const firstEvaluationResult = await runTx10Imp1Agent(testInput, {
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
      notificationServiceAdapter: mockNotificationServiceAdapter,
    });

    // 初回評価結果から移行判定結果を抽出
    const firstSubmissionRate = firstEvaluationResult.initialReportAnalysis.submissionRate;
    const firstDataQualityScore = firstEvaluationResult.initialReportAnalysis.dataQualityScore;
    const firstFormatUniformityScore = firstEvaluationResult.initialReportAnalysis.formatUniformityScore;
    const firstOnboardingStatus = firstEvaluationResult.onboardingApprovalStatus;

    // モックをリセット
    jest.clearAllMocks();

    // モック再設定（同じ動作を返すように）
    mockTextAnalysisServiceAdapter.extractKeywords = jest.fn(async (text: string) => {
      return {
        keywords: ['パフォーマンス', '問題'],
        frequency: [3, 2],
      };
    });

    mockTextAnalysisServiceAdapter.assessImpactScore = jest.fn(async (keyword: string) => {
      const scoreMap: Record<string, number> = {
        'パフォーマンス': 75,
        '問題': 60,
      };
      return scoreMap[keyword] || 50;
    });

    mockTextAnalysisServiceAdapter.classifyIssueSeverity = jest.fn(async (issueText: string) => {
      if (issueText.includes('パフォーマンス')) {
        return '高';
      }
      return '中';
    });

    mockNotificationServiceAdapter.sendReminderNotification = jest.fn(async (userId: string, message: string) => {
      return { status: 'success', deliveredAt: new Date('2024-01-15T08:30:00Z') };
    });

    mockNotificationServiceAdapter.scheduleNotification = jest.fn(async (userId: string, scheduledTime: Date, message: string) => {
      return { status: 'scheduled', scheduledAt: scheduledTime };
    });

    mockNotificationServiceAdapter.getDeliveryStatus = jest.fn(async (userId: string) => {
      return { status: 'delivered', count: 1 };
    });

    // 2回目評価実行
    const secondEvaluationResult = await runTx10Imp1Agent(testInput, {
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
      notificationServiceAdapter: mockNotificationServiceAdapter,
    });

    // 2回目評価結果から移行判定結果を抽出
    const secondSubmissionRate = secondEvaluationResult.initialReportAnalysis.submissionRate;
    const secondDataQualityScore = secondEvaluationResult.initialReportAnalysis.dataQualityScore;
    const secondFormatUniformityScore = secondEvaluationResult.initialReportAnalysis.formatUniformityScore;
    const secondOnboardingStatus = secondEvaluationResult.onboardingApprovalStatus;

    // 初回と2回目の移行判定結果が完全に一致することを確認
    expect(firstSubmissionRate).toBe(secondSubmissionRate);
    expect(firstDataQualityScore).toBe(secondDataQualityScore);
    expect(firstFormatUniformityScore).toBe(secondFormatUniformityScore);
    expect(firstOnboardingStatus.approved).toBe(secondOnboardingStatus.approved);
    expect(firstOnboardingStatus.canProceedToProduction).toBe(secondOnboardingStatus.canProceedToProduction);

    // 決定性を持つことが確認される（同じ入力に対して常に同じ出力を返す）
    expect(firstEvaluationResult.initialReportAnalysis).toEqual(secondEvaluationResult.initialReportAnalysis);
    expect(firstEvaluationResult.onboardingApprovalStatus).toEqual(secondEvaluationResult.onboardingApprovalStatus);
  });
});