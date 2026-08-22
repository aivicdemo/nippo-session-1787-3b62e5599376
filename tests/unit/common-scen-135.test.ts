import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-135
  test('should escalate when analysis results deviate significantly from past trends', async () => {
    const mockAiClient = {
      analyzeMonthlyTrends: jest.fn(),
      extractReportData: jest.fn(),
      calculatePerformanceMetrics: jest.fn(),
      generatePriorityScores: jest.fn(),
      checkTrendDeviation: jest.fn(),
    };

    const currentMonthData = Array.from({ length: 10 }, (_, i) => ({
      reportId: `report_${i}`,
      submittedAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T09:00:00Z`),
      issueCount: 50,
      issuesByPriority: {
        high: 35,
        medium: 12,
        low: 3,
      },
      teamId: `team_${i % 3}`,
      resolutionDays: 2.5,
    }));

    const pastThreeMonthsAverage = {
      averageIssueCount: 20,
      averageHighPriorityRatio: 0.25,
      averageMediumPriorityRatio: 0.50,
      averageLowPriorityRatio: 0.25,
      averageResolutionDays: 3.2,
    };

    const deviationAnalysis = {
      issueCountChange: 150,
      highPriorityRatioChange: 40,
      mediumPriorityRatioChange: -40,
      lowPriorityRatioChange: -55,
      exceedsThreshold: true,
      deviationType: 'critical_increase_with_priority_inversion',
    };

    mockAiClient.extractReportData.mockResolvedValueOnce({
      dataPoints: currentMonthData,
      periodStart: '2024-01-01T00:00:00Z',
      periodEnd: '2024-01-31T23:59:59Z',
    });

    mockAiClient.analyzeMonthlyTrends.mockResolvedValueOnce({
      trends: {
        timeSeriesChange: {
          issueCountCurrent: 50,
          issueCountPast: 20,
        },
        bottleneckShifts: [
          {
            fromBottleneck: 'code_review_delays',
            toBottleneck: 'deployment_blockers',
            shiftDate: '2024-01-15T00:00:00Z',
          },
        ],
      },
    });

    mockAiClient.calculatePerformanceMetrics.mockResolvedValueOnce({
      byTeam: [
        { teamId: 'team_0', throughput: 12, cycleTime: 2.1 },
        { teamId: 'team_1', throughput: 10, cycleTime: 3.5 },
        { teamId: 'team_2', throughput: 8, cycleTime: 2.8 },
      ],
    });

    mockAiClient.checkTrendDeviation.mockResolvedValueOnce(deviationAnalysis);

    mockAiClient.generatePriorityScores.mockRejectedValueOnce(
      new Error('Skipped: awaiting escalation decision')
    );

    const auditLog: Array<{ eventType: string; status: string; timestamp: string; actor: string; escalationReason?: string }> = [];

    const result = await generateMonthlyAnalysisReport(
      {
        reportingPeriod: { start: '2024-01-01', end: '2024-01-31' },
        includeTeamMetrics: true,
        pastTrendWindow: 3,
        deviationThreshold: 15,
      },
      mockAiClient,
      {
        logAuditEvent: (event) => {
          auditLog.push(event);
        },
      }
    );

    expect(result.escalated).toBe(true);
    expect(result.escalationReason).toMatch(/分析結果が過去の傾向と大きく乖離しました/);
    expect(result.escalationReason).toMatch(/課題件数が\+150%増加/);
    expect(result.escalationReason).toMatch(/重度度分布が逆転/);
    expect(result.handoffTarget).toBe('department_head');
    expect(result.handoffTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.pendingSideEffects).toBeDefined();
    expect(Array.isArray(result.pendingSideEffects)).toBe(true);
    expect(result.pendingSideEffects.length).toBeGreaterThan(0);

    const escalationEvent = auditLog.find((e) => e.eventType === 'escalation_triggered');
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.actor).toBe('ai_agent_tx7_imp1');
    expect(escalationEvent?.status).toBe('awaiting_human_review');
    expect(escalationEvent?.escalationReason).toMatch(/分析結果が過去の傾向と大きく乖離しました/);
    expect(escalationEvent?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(mockAiClient.extractReportData).toHaveBeenCalledWith({
      reportingPeriod: { start: '2024-01-01', end: '2024-01-31' },
    });
    expect(mockAiClient.analyzeMonthlyTrends).toHaveBeenCalled();
    expect(mockAiClient.calculatePerformanceMetrics).toHaveBeenCalled();
    expect(mockAiClient.checkTrendDeviation).toHaveBeenCalledWith(
      expect.objectContaining({
        currentMetrics: expect.any(Object),
        pastAverageMetrics: expect.any(Object),
        threshold: 15,
      })
    );
    expect(mockAiClient.generatePriorityScores).not.toHaveBeenCalled();
  });
});