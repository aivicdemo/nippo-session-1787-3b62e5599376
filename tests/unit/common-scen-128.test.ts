import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-04';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-128
  test('月初日のトリガーで課題の時系列変化を分析し、分析結果を次のアクションへ正常に受け渡す', async () => {
    const mockReportGenerationRequest = {
      targetMonth: '2024-01',
      teamId: 'team-001',
      triggeredBy: 'schedule' as const,
      includeDetailedAnalysis: true,
    };

    const mockAccumulatedReports = Array.from({ length: 30 }, (_, dayIndex) => {
      const day = dayIndex + 1;
      return Array.from({ length: 10 }, (_, memberIndex) => {
        const memberId = `member-${String(memberIndex + 1).padStart(3, '0')}`;
        return {
          reportId: `report-2024-01-${String(day).padStart(2, '0')}-${memberId}`,
          teamId: 'team-001',
          reportDate: `2024-01-${String(day).padStart(2, '0')}`,
          memberId: memberId,
          yesterdayAccomplishment: `completed task ${day}-${memberIndex}`,
          todayPlan: `plan for day ${day}-${memberIndex}`,
          issues: day % 7 === 0 ? [`issue-${day}-${memberIndex}`] : [],
          submittedAt: `2024-01-${String(day).padStart(2, '0')}T08:00:00Z`,
        };
      });
    }).flat();

    const mockTimeSeriesAnalysisResult = {
      analysisDate: '2024-02-01T00:00:00Z',
      trendPeriod: '2024-01-01〜2024-01-31',
      timeSeriesData: [
        {
          week: 1,
          issueCount: 5,
          categories: [
            { category: 'quality', count: 3 },
            { category: 'schedule', count: 2 },
          ],
        },
        {
          week: 2,
          issueCount: 4,
          categories: [
            { category: 'quality', count: 2 },
            { category: 'schedule', count: 2 },
          ],
        },
        {
          week: 3,
          issueCount: 6,
          categories: [
            { category: 'quality', count: 4 },
            { category: 'resource', count: 2 },
          ],
        },
        {
          week: 4,
          issueCount: 3,
          categories: [
            { category: 'quality', count: 2 },
            { category: 'schedule', count: 1 },
          ],
        },
      ],
      newIssuesDetected: false,
      analysisVersion: ACTION_04_PROMPT_VERSION,
    };

    const fakeAiClient: any = {
      action01: jest.fn().mockResolvedValue({
        triggeredAt: '2024-02-01T00:00:00Z',
        reportGenerationConfirmed: true,
      }),
      action02: jest.fn().mockResolvedValue({
        extractedReportIds: mockAccumulatedReports.map((r) => r.reportId),
        totalReportsExtracted: mockAccumulatedReports.length,
      }),
      action03: jest.fn().mockResolvedValue({
        reportGenerationCompleted: true,
        reportStructure: {
          targetMonth: '2024-01',
          generatedAt: '2024-02-01T00:00:00Z',
        },
      }),
      action04: jest.fn().mockResolvedValue(mockTimeSeriesAnalysisResult),
      action05: jest.fn().mockResolvedValue({
        bottleneckPhases: [
          { week: 3, severity: 'high', primaryBottleneck: 'quality' },
        ],
      }),
      action06: jest.fn().mockResolvedValue({
        performanceMetrics: {
          averageIssueResolutionDays: 2.5,
          issueReportingRate: 0.85,
          recurrenceRate: 0.12,
        },
      }),
      action07: jest.fn().mockResolvedValue({
        analysisReportGenerated: true,
        reportId: 'monthly-report-2024-01-001',
      }),
      action08: jest.fn().mockResolvedValue({
        distributionCompleted: true,
        recipientCount: 5,
      }),
    };

    const result = await runTx7Imp1Agent(mockReportGenerationRequest, fakeAiClient);

    expect(fakeAiClient.action04).toHaveBeenCalled();

    const action04CallArgs = fakeAiClient.action04.mock.calls[0];
    expect(action04CallArgs).toBeDefined();
    expect(action04CallArgs[0]).toEqual(
      expect.objectContaining({
        targetMonth: '2024-01',
        teamId: 'team-001',
      })
    );
    expect(action04CallArgs[0].accumulatedReports).toBeDefined();
    expect(Array.isArray(action04CallArgs[0].accumulatedReports)).toBe(true);
    expect(action04CallArgs[0].accumulatedReports.length).toBe(300);

    expect(mockTimeSeriesAnalysisResult).toEqual(
      expect.objectContaining({
        analysisDate: expect.any(String),
        trendPeriod: expect.stringContaining('2024-01'),
        timeSeriesData: expect.any(Array),
        newIssuesDetected: expect.any(Boolean),
        analysisVersion: expect.any(String),
      })
    );

    expect(mockTimeSeriesAnalysisResult.timeSeriesData).toHaveLength(4);
    mockTimeSeriesAnalysisResult.timeSeriesData.forEach((weekData) => {
      expect(weekData).toEqual(
        expect.objectContaining({
          week: expect.any(Number),
          issueCount: expect.any(Number),
          categories: expect.any(Array),
        })
      );
    });

    expect(fakeAiClient.action05).toHaveBeenCalled();

    const action05CallArgs = fakeAiClient.action05.mock.calls[0];
    expect(action05CallArgs[0]).toEqual(
      expect.objectContaining({
        timeSeriesData: mockTimeSeriesAnalysisResult.timeSeriesData,
      })
    );

    expect(result).toBeDefined();
    expect(result).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        generatedAt: expect.any(String),
        status: expect.stringMatching(/success|partial_success|failed/),
      })
    );
  });
});