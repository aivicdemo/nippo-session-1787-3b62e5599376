import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('TX6 Agent - 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-113
  test('[normal] 日報収集から分析レポート生成までの自動実行 AIエージェント - 「日報収集から分析レポート生成までの自動実行」が自律処理「部長とステークホルダーにレポートを配信する」を契約どおり実行する', async () => {
    const executionTimestamp = new Date('2024-01-22T09:00:00Z');
    const analysisStartDate = '2024-01-15';
    const analysisEndDate = '2024-01-21';
    const teamId = 'team-001';

    const mockReportId = 'report-2024-01-22-001';
    const mockReportGeneratedAt = new Date('2024-01-22T09:15:00Z');
    const mockEmailSentAt = new Date('2024-01-22T09:16:00Z');

    const extractedIssues = [
      {
        issueKeyword: 'API遅延',
        occurrenceCount: 3,
        priorityScore: 85,
        priorityRank: '高',
      },
      {
        issueKeyword: 'テスト不足',
        occurrenceCount: 2,
        priorityScore: 72,
        priorityRank: '中',
      },
      {
        issueKeyword: 'ドキュメント更新漏れ',
        occurrenceCount: 1,
        priorityScore: 45,
        priorityRank: '低',
      },
    ];

    const departmentHeadEmail = 'head@example.com';
    const stakeholderEmails = ['stakeholder1@example.com', 'stakeholder2@example.com'];

    let action01Called = false;
    let action02Called = false;
    let action03Called = false;
    let action04Called = false;
    let action05Called = false;
    let action06Called = false;
    let action07Called = false;
    let action07CallCount = 0;
    let capturedAction07Params: any = null;
    let emailSendSpyLog: any[] = [];

    const mockAiClient: Tx6Imp1AiClient = {
      action01_collectReportData: async (input) => {
        action01Called = true;
        return {
          teamId: input.teamId,
          analysisStartDate: input.analysisStartDate,
          analysisEndDate: input.analysisEndDate,
          collectedReportCount: 15,
          submissionRate: 0.75,
          reportDataSnapshot: {
            reportIds: Array.from({ length: 15 }, (_, i) => `report-${i + 1}`),
          },
        };
      },

      action02_identifyMissingReports: async (input) => {
        action02Called = true;
        return {
          missingMemberCount: 5,
          missingMemberList: ['member-001', 'member-002', 'member-003', 'member-004', 'member-005'],
          reminderSentCount: 5,
          reminderSentAt: new Date('2024-01-22T09:05:00Z'),
        };
      },

      action03_extractAndClassifyIssues: async (input) => {
        action03Called = true;
        return {
          totalIssuesExtracted: 3,
          issuesByCategory: {
            技術課題: 2,
            プロセス課題: 1,
          },
          extractedIssues: extractedIssues,
        };
      },

      action04_analyzeTrendAndTimeSeriesPatterns: async (input) => {
        action04Called = true;
        return {
          trendAnalysisResult: {
            dominantCategory: '技術課題',
            weeklyCategoryDistribution: {
              技術課題: 2,
              プロセス課題: 1,
            },
            bottleneckTransition: ['API遅延→テスト不足→ドキュメント更新漏れ'],
          },
          anomalyDetected: false,
        };
      },

      action05_scoreAndRankPriority: async (input) => {
        action05Called = true;
        return {
          priorityRankedIssues: extractedIssues.sort(
            (a, b) => b.priorityScore - a.priorityScore
          ),
          topPriorityCount: 1,
        };
      },

      action06_generateAnalysisReport: async (input) => {
        action06Called = true;
        return {
          reportId: mockReportId,
          reportGeneratedAt: mockReportGeneratedAt,
          reportContent: {
            title: '前週の課題分析結果',
            summary: '前週の日報から抽出された課題分析結果',
            analysisMetadata: {
              submissionRate: 0.75,
              categoryCount: 2,
              totalIssueCount: 3,
              analysisPeriod: {
                startDate: analysisStartDate,
                endDate: analysisEndDate,
              },
            },
            prioritizedIssues: extractedIssues,
            recommendedActions: [
              {
                issueKeyword: 'API遅延',
                recommendedAction: 'API性能改善チームと連携',
              },
              {
                issueKeyword: 'テスト不足',
                recommendedAction: 'テストカバレッジ拡大',
              },
            ],
            csvData: 'issueKeyword,occurrenceCount,priorityScore,priorityRank\nAPI遅延,3,85,高\nテスト不足,2,72,中\nドキュメント更新漏れ,1,45,低',
          },
        };
      },

      action07_deliverReportToHeadAndStakeholders: async (input) => {
        action07Called = true;
        action07CallCount += 1;
        capturedAction07Params = input;

        const allRecipients = [departmentHeadEmail, ...stakeholderEmails];

        emailSendSpyLog.push({
          timestamp: new Date('2024-01-22T09:16:00Z'),
          recipientType: input.recipientType,
          recipients: allRecipients,
          reportContentLength: input.reportContent ? input.reportContent.length : 0,
          hasAttachment: !!input.attachmentData,
        });

        return {
          success: true,
          deliveredCount: allRecipients.length,
          timestamp: mockEmailSentAt,
          deliveryDetails: {
            departmentHeadDelivered: true,
            stakeholderDelivered: true,
            stakeholderCount: stakeholderEmails.length,
          },
        };
      },
    };

    const input = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    const result = await runTx6Imp1Agent(input, mockAiClient);

    expect(action01Called).toBe(true);
    expect(action02Called).toBe(true);
    expect(action03Called).toBe(true);
    expect(action04Called).toBe(true);
    expect(action05Called).toBe(true);
    expect(action06Called).toBe(true);
    expect(action07Called).toBe(true);

    expect(action07CallCount).toBe(1);

    expect(capturedAction07Params).toBeDefined();
    expect(capturedAction07Params.recipientType).toBe('department_head_and_stakeholders');
    expect(capturedAction07Params.reportContent).toBeDefined();
    expect(typeof capturedAction07Params.reportContent).toBe('string');
    expect(capturedAction07Params.reportContent.length).toBeGreaterThan(0);

    expect(capturedAction07Params.reportContent).toMatch(/前週の課題分析結果/);
    expect(capturedAction07Params.reportContent).toMatch(/優先度スコア/);
    expect(capturedAction07Params.reportContent).toMatch(/推奨対応/);

    expect(capturedAction07Params.priorityScores).toBeDefined();
    expect(Array.isArray(capturedAction07Params.priorityScores)).toBe(true);
    expect(capturedAction07Params.priorityScores.length).toBeGreaterThanOrEqual(3);

    capturedAction07Params.priorityScores.forEach((score: number) => {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    });

    expect(capturedAction07Params.analysisMetadata).toBeDefined();
    expect(capturedAction07Params.analysisMetadata.submissionRate).toBe(0.75);
    expect(capturedAction07Params.analysisMetadata.submissionRate).toBeGreaterThanOrEqual(0.7);
    expect(capturedAction07Params.analysisMetadata.categoryCount).toBeGreaterThanOrEqual(3);

    expect(emailSendSpyLog).toBeDefined();
    expect(emailSendSpyLog.length).toBe(1);

    const emailLog = emailSendSpyLog[0];
    expect(emailLog.recipients).toContain(departmentHeadEmail);
    expect(emailLog.recipients.length).toBeGreaterThanOrEqual(1 + stakeholderEmails.length);

    expect(capturedAction07Params.attachmentData).toBeDefined();
    expect(typeof capturedAction07Params.attachmentData).toBe('string');
    expect(capturedAction07Params.attachmentData).toContain('issueKeyword');
    expect(capturedAction07Params.attachmentData).toContain('API遅延');

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.deliveredCount).toBe(3);
    expect(result.timestamp).toEqual(mockEmailSentAt);

    expect(typeof result.timestamp.getTime).toBe('function');

    expect(result).toEqual({
      success: true,
      deliveredCount: 3,
      timestamp: mockEmailSentAt,
      deliveryDetails: {
        departmentHeadDelivered: true,
        stakeholderDelivered: true,
        stakeholderCount: 2,
      },
    });
  });
});