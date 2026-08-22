import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  // SCEN-110: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント
  // Action-04『課題の発生頻度、カテゴリ別の傾向を分析する』が提出済み日報から正確に課題を分類し、
  // 発生頻度とカテゴリ別比率を算出する
  test('should analyze issue frequency and category ratio from submitted reports for previous week', async () => {
    const previousWeekMonday = new Date('2024-01-08T00:00:00Z');
    const previousWeekSunday = new Date('2024-01-14T23:59:59Z');
    const analysisTimestamp = new Date('2024-01-15T10:30:00Z');

    const submittedReports = [
      {
        memberId: 'member-a',
        reportDate: '2024-01-08',
        issues: ['システム連携エラー'],
        submittedAt: '2024-01-08T09:00:00Z',
      },
      {
        memberId: 'member-b',
        reportDate: '2024-01-09',
        issues: ['ドキュメント未更新'],
        submittedAt: '2024-01-09T09:00:00Z',
      },
      {
        memberId: 'member-c',
        reportDate: '2024-01-10',
        issues: ['システム連携エラー', 'テスト環境不足'],
        submittedAt: '2024-01-10T09:00:00Z',
      },
      {
        memberId: 'member-d',
        reportDate: '2024-01-11',
        issues: ['ドキュメント未更新'],
        submittedAt: '2024-01-11T09:00:00Z',
      },
      {
        memberId: 'member-e',
        reportDate: '2024-01-12',
        issues: ['コミュニケーション遅延'],
        submittedAt: '2024-01-12T09:00:00Z',
      },
      {
        memberId: 'member-f',
        reportDate: '2024-01-13',
        issues: ['システム連携エラー'],
        submittedAt: '2024-01-13T09:00:00Z',
      },
      {
        memberId: 'member-g',
        reportDate: '2024-01-14',
        issues: ['テスト環境不足', 'ドキュメント未更新'],
        submittedAt: '2024-01-14T09:00:00Z',
      },
      {
        memberId: 'member-h',
        reportDate: '2024-01-15',
        issues: ['システム連携エラー', 'コミュニケーション遅延'],
        submittedAt: '2024-01-15T09:00:00Z',
      },
    ];

    const issueFrequencyMap = new Map<string, number>();
    const totalIssueCount = submittedReports.reduce((sum, report) => {
      report.issues.forEach((issue) => {
        issueFrequencyMap.set(issue, (issueFrequencyMap.get(issue) ?? 0) + 1);
      });
      return sum + report.issues.length;
    }, 0);

    const analysisResult = {
      analysisStartDate: previousWeekMonday.toISOString(),
      analysisEndDate: previousWeekSunday.toISOString(),
      analysisExecutedAt: analysisTimestamp.toISOString(),
      totalSubmittedReports: submittedReports.length,
      submissionRate: 0.8,
      issues: [
        {
          issueCategory: 'システム連携エラー',
          frequencyCount: 4,
          categoryRatio: 4 / totalIssueCount,
        },
        {
          issueCategory: 'ドキュメント未更新',
          frequencyCount: 3,
          categoryRatio: 3 / totalIssueCount,
        },
        {
          issueCategory: 'テスト環境不足',
          frequencyCount: 2,
          categoryRatio: 2 / totalIssueCount,
        },
        {
          issueCategory: 'コミュニケーション遅延',
          frequencyCount: 2,
          categoryRatio: 2 / totalIssueCount,
        },
      ],
    };

    const mockAiClient = {
      callAiForAction01: jest.fn().mockResolvedValue({}),
      callAiForAction02: jest.fn().mockResolvedValue({}),
      callAiForAction03: jest.fn().mockResolvedValue({}),
      callAiForAction04: jest.fn().mockResolvedValue(analysisResult),
      callAiForAction05: jest.fn().mockResolvedValue({}),
      callAiForAction06: jest.fn().mockResolvedValue({}),
      callAiForAction07: jest.fn().mockResolvedValue({}),
    };

    const mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    const result = await sendUnsubmittedReminder(
      {
        previousWeekMonday,
        previousWeekSunday,
        submittedReports,
      },
      mockAiClient as any,
      mockNotificationService as any
    );

    expect(result).toBeDefined();
    expect(result.analysisStartDate).toBe(previousWeekMonday.toISOString());
    expect(result.analysisEndDate).toBe(previousWeekSunday.toISOString());
    expect(result.totalSubmittedReports).toBe(8);
    expect(result.submissionRate).toBe(0.8);

    const systemIntegrationIssue = result.issues.find(
      (i) => i.issueCategory === 'システム連携エラー'
    );
    expect(systemIntegrationIssue).toBeDefined();
    expect(systemIntegrationIssue?.frequencyCount).toBe(4);
    expect(systemIntegrationIssue?.categoryRatio).toBeCloseTo(0.3077, 4);

    const documentationIssue = result.issues.find(
      (i) => i.issueCategory === 'ドキュメント未更新'
    );
    expect(documentationIssue).toBeDefined();
    expect(documentationIssue?.frequencyCount).toBe(3);
    expect(documentationIssue?.categoryRatio).toBeCloseTo(0.2308, 4);

    const testEnvironmentIssue = result.issues.find(
      (i) => i.issueCategory === 'テスト環境不足'
    );
    expect(testEnvironmentIssue).toBeDefined();
    expect(testEnvironmentIssue?.frequencyCount).toBe(2);
    expect(testEnvironmentIssue?.categoryRatio).toBeCloseTo(0.1538, 4);

    const communicationIssue = result.issues.find(
      (i) => i.issueCategory === 'コミュニケーション遅延'
    );
    expect(communicationIssue).toBeDefined();
    expect(communicationIssue?.frequencyCount).toBe(2);
    expect(communicationIssue?.categoryRatio).toBeCloseTo(0.1538, 4);

    const executionTimestamp = new Date(result.analysisExecutedAt);
    const timeDiff = Math.abs(
      executionTimestamp.getTime() - analysisTimestamp.getTime()
    );
    expect(timeDiff).toBeLessThanOrEqual(60000);

    expect(mockAiClient.callAiForAction04).toHaveBeenCalled();
  });
});