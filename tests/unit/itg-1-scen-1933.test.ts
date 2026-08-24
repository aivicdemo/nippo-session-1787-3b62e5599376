import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput, type RecurringIssuePattern } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('課題の再発パターン分析機能 - 月をまたぐ期間の時系列整序', () => {
  // SCEN-1933
  test('分析期間が月をまたぐ場合、全期間の課題が時系列で正しく並序される', async () => {
    const mockAiClient = {
      extractKeywords: jest.fn(async (text: string) => ({
        keywords: [
          { keyword: 'API連携エラー', frequency: 2, confidence: 0.95 },
          { keyword: 'テスト失敗', frequency: 1, confidence: 0.88 }
        ]
      })),
      assessImpactScore: jest.fn(async (keyword: string, context: string) => ({
        impactScore: 75,
        severity: 'high'
      })),
      classifyIssueSeverity: jest.fn(async (issueText: string) => ({
        severity: 'high',
        reasoning: 'Production impact detected'
      })),
      generateRecurringPatternAnalysis: jest.fn(async (
        issues: Array<{ reportedDate: string; keyword: string; impactScore: number }>,
        analysisStartDate: string,
        analysisEndDate: string
      ) => ({
        patterns: [
          {
            issueKeyword: 'API連携エラー',
            occurrenceCount: 6,
            timeSeriesPattern: '増加傾向',
            priorityScore: 85
          },
          {
            issueKeyword: 'テスト失敗',
            occurrenceCount: 4,
            timeSeriesPattern: '周期的',
            priorityScore: 65
          }
        ]
      })),
      generateVisualizationGraphs: jest.fn(async (
        patterns: RecurringIssuePattern[],
        analysisStartDate: string,
        analysisEndDate: string
      ) => ({
        graphs: [
          {
            graphType: '折れ線',
            title: '課題発生頻度の推移',
            dataPoints: [
              { date: '2024-08-25', count: 3 },
              { date: '2024-08-26', count: 1 },
              { date: '2024-08-27', count: 1 },
              { date: '2024-08-28', count: 1 },
              { date: '2024-08-29', count: 1 },
              { date: '2024-08-30', count: 1 },
              { date: '2024-08-31', count: 1 },
              { date: '2024-09-01', count: 1 },
              { date: '2024-09-02', count: 1 },
              { date: '2024-09-03', count: 1 },
              { date: '2024-09-04', count: 1 },
              { date: '2024-09-05', count: 1 }
            ]
          }
        ]
      }))
    };

    const input: Tx8AgentInput = {
      analysisStartDate: '2024-08-25',
      analysisEndDate: '2024-09-05',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001'
    };

    const mockReportingSystemFetch = async (url: string) => {
      if (url.includes('/api/issues')) {
        return {
          ok: true,
          json: async () => ({
            issues: [
              {
                id: 'issue-001',
                keyword: 'API連携エラー',
                reportedDate: '2024-08-25T08:15:00Z',
                impactScore: 80
              },
              {
                id: 'issue-002',
                keyword: 'API連携エラー',
                reportedDate: '2024-08-25T09:30:00Z',
                impactScore: 75
              },
              {
                id: 'issue-003',
                keyword: 'テスト失敗',
                reportedDate: '2024-08-25T11:45:00Z',
                impactScore: 60
              },
              {
                id: 'issue-004',
                keyword: 'API連携エラー',
                reportedDate: '2024-08-26T07:20:00Z',
                impactScore: 78
              },
              {
                id: 'issue-005',
                keyword: 'テスト失敗',
                reportedDate: '2024-08-27T14:10:00Z',
                impactScore: 65
              },
              {
                id: 'issue-006',
                keyword: 'API連携エラー',
                reportedDate: '2024-08-28T10:00:00Z',
                impactScore: 82
              },
              {
                id: 'issue-007',
                keyword: 'テスト失敗',
                reportedDate: '2024-08-29T15:30:00Z',
                impactScore: 68
              },
              {
                id: 'issue-008',
                keyword: 'API連携エラー',
                reportedDate: '2024-08-30T09:15:00Z',
                impactScore: 76
              },
              {
                id: 'issue-009',
                keyword: 'テスト失敗',
                reportedDate: '2024-08-31T13:45:00Z',
                impactScore: 70
              },
              {
                id: 'issue-010',
                keyword: 'API連携エラー',
                reportedDate: '2024-09-01T08:00:00Z',
                impactScore: 79
              },
              {
                id: 'issue-011',
                keyword: 'テスト失敗',
                reportedDate: '2024-09-02T11:20:00Z',
                impactScore: 62
              },
              {
                id: 'issue-012',
                keyword: 'API連携エラー',
                reportedDate: '2024-09-03T16:50:00Z',
                impactScore: 81
              },
              {
                id: 'issue-013',
                keyword: 'テスト失敗',
                reportedDate: '2024-09-04T10:30:00Z',
                impactScore: 66
              },
              {
                id: 'issue-014',
                keyword: 'API連携エラー',
                reportedDate: '2024-09-05T14:15:00Z',
                impactScore: 77
              }
            ]
          })
        };
      }
      throw new Error('Unexpected API call');
    };

    global.fetch = mockReportingSystemFetch as any;

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThanOrEqual(2);

    const apiPattern = result.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'API連携エラー'
    );
    expect(apiPattern).toBeDefined();
    expect(apiPattern?.occurrenceCount).toBe(6);
    expect(apiPattern?.priorityScore).toBe(85);
    expect(apiPattern?.timeSeriesPattern).toBe('増加傾向');

    const testPattern = result.recurringIssuePatterns.find(
      (p: RecurringIssuePattern) => p.issueKeyword === 'テスト失敗'
    );
    expect(testPattern).toBeDefined();
    expect(testPattern?.occurrenceCount).toBe(4);
    expect(testPattern?.priorityScore).toBe(65);
    expect(testPattern?.timeSeriesPattern).toBe('周期的');

    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    const timelineGraph = result.visualizationGraphs[0];
    expect(timelineGraph.graphType).toBe('折れ線');
    expect(timelineGraph.title).toBe('課題発生頻度の推移');
    expect(Array.isArray(timelineGraph.dataPoints)).toBe(true);
    expect(timelineGraph.dataPoints.length).toBe(12);

    const dataPoints = timelineGraph.dataPoints as Array<{ date: string; count: number }>;

    for (let i = 0; i < dataPoints.length - 1; i++) {
      const currentDate = new Date(dataPoints[i].date).getTime();
      const nextDate = new Date(dataPoints[i + 1].date).getTime();
      expect(currentDate).toBeLessThanOrEqual(nextDate);
    }

    expect(dataPoints[0].date).toBe('2024-08-25');
    expect(dataPoints[0].count).toBe(3);

    expect(dataPoints[6].date).toBe('2024-08-31');
    expect(dataPoints[7].date).toBe('2024-09-01');

    expect(dataPoints[11].date).toBe('2024-09-05');
    expect(dataPoints[11].count).toBe(1);

    const startRangeDate = new Date('2024-08-25T00:00:00Z').getTime();
    const endRangeDate = new Date('2024-09-05T23:59:59Z').getTime();

    dataPoints.forEach((point: { date: string; count: number }) => {
      const pointDate = new Date(point.date).getTime();
      expect(pointDate).toBeGreaterThanOrEqual(startRangeDate);
      expect(pointDate).toBeLessThanOrEqual(endRangeDate);
    });

    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate instanceof Date && !isNaN(emailSentDate.getTime())).toBe(true);

    expect(mockAiClient.generateRecurringPatternAnalysis).toHaveBeenCalled();
    expect(mockAiClient.generateVisualizationGraphs).toHaveBeenCalled();
  });
});