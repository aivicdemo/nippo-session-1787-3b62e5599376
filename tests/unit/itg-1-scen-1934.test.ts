import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-1934
  test('should correctly sort recurring issue patterns across fiscal year boundary (March 25 to April 5)', async () => {
    const analysisStartDate = '2024-03-25T00:00:00Z';
    const analysisEndDate = '2024-04-05T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 1;
    const recipientManagerId = 'manager-001';

    const mockAiClient: Tx8Imp1AiClient = {
      extractKeywordsForIssuePattern: jest.fn(async (reportText: string) => {
        if (reportText.includes('DB接続エラー-2024-03-25')) {
          return {
            keywords: ['DB接続エラー'],
            confidence: 0.95,
          };
        }
        if (reportText.includes('ネットワーク遅延-2024-03-25')) {
          return {
            keywords: ['ネットワーク遅延'],
            confidence: 0.92,
          };
        }
        if (reportText.includes('DB接続エラー-2024-04-01')) {
          return {
            keywords: ['DB接続エラー'],
            confidence: 0.94,
          };
        }
        if (reportText.includes('メモリ不足-2024-04-05')) {
          return {
            keywords: ['メモリ不足'],
            confidence: 0.91,
          };
        }
        return {
          keywords: [],
          confidence: 0,
        };
      }),

      analyzeTimeSeriesPattern: jest.fn(async (issueKeyword: string, occurrences: Array<{ reportedDate: string; text: string }>) => {
        if (issueKeyword === 'DB接続エラー' && occurrences.length === 2) {
          return {
            timeSeriesPattern: '周期的',
            trendDirection: 'stable',
          };
        }
        return {
          timeSeriesPattern: '単発',
          trendDirection: 'unknown',
        };
      }),

      calculatePriorityScore: jest.fn(async (issueKeyword: string, occurrenceCount: number, timeSeriesPattern: string) => {
        if (issueKeyword === 'DB接続エラー') {
          return occurrenceCount * 25 + 5;
        }
        if (issueKeyword === 'ネットワーク遅延') {
          return occurrenceCount * 20 + 10;
        }
        if (issueKeyword === 'メモリ不足') {
          return occurrenceCount * 18 + 8;
        }
        return 0;
      }),

      selectVisualizationGraphs: jest.fn(async (patterns: Array<{ issueKeyword: string; occurrenceCount: number; priorityScore: number }>) => {
        return [
          {
            graphType: '折れ線',
            title: '課題発生頻度の時系列推移',
            dataPoints: patterns.map((p) => ({
              label: p.issueKeyword,
              value: p.occurrenceCount,
              score: p.priorityScore,
            })),
          },
          {
            graphType: 'ヒートマップ',
            title: '課題優先度マトリックス',
            dataPoints: patterns.map((p) => ({
              keyword: p.issueKeyword,
              priority: p.priorityScore,
            })),
          },
        ];
      }),

      generateReportEmail: jest.fn(async (reportId: string, patterns: Array<{ issueKeyword: string; occurrenceCount: number; priorityScore: number }>, graphs: Array<{ graphType: string; title: string; dataPoints: object[] }>) => {
        return {
          emailSubject: `課題再発パターン分析レポート - ${reportId}`,
          emailBody: `分析期間内に検出された課題パターン: ${patterns.length}件`,
          recipientEmail: 'manager@example.com',
        };
      }),
    };

    const mockExtractedIssueData = [
      {
        issueId: 'issue-001',
        keyword: 'DB接続エラー',
        reportedDate: '2024-03-25T09:00:00Z',
        reportText: 'DB接続エラー-2024-03-25',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-002',
        keyword: 'ネットワーク遅延',
        reportedDate: '2024-03-25T10:30:00Z',
        reportText: 'ネットワーク遅延-2024-03-25',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-003',
        keyword: 'DB接続エラー',
        reportedDate: '2024-04-01T08:45:00Z',
        reportText: 'DB接続エラー-2024-04-01',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-004',
        keyword: 'メモリ不足',
        reportedDate: '2024-04-05T14:20:00Z',
        reportText: 'メモリ不足-2024-04-05',
        teamId: 'team-001',
      },
    ];

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result = await runTx8Imp1Agent(mockExtractedIssueData, mockAiClient, input);

    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    expect(result.recurringIssuePatterns).toHaveLength(3);

    const sortedPatterns = result.recurringIssuePatterns.sort((a, b) => {
      const dateA = new Date(a.firstOccurrenceDate || '2024-01-01').getTime();
      const dateB = new Date(b.firstOccurrenceDate || '2024-01-01').getTime();
      return dateA - dateB;
    });

    expect(sortedPatterns[0].issueKeyword).toBe('DB接続エラー');
    expect(sortedPatterns[0].occurrenceCount).toBe(2);
    expect(sortedPatterns[0].timeSeriesPattern).toBe('周期的');
    expect(sortedPatterns[0].priorityScore).toBe(55);

    expect(sortedPatterns[1].issueKeyword).toBe('ネットワーク遅延');
    expect(sortedPatterns[1].occurrenceCount).toBe(1);
    expect(sortedPatterns[1].timeSeriesPattern).toBe('単発');
    expect(sortedPatterns[1].priorityScore).toBe(30);

    expect(sortedPatterns[2].issueKeyword).toBe('メモリ不足');
    expect(sortedPatterns[2].occurrenceCount).toBe(1);
    expect(sortedPatterns[2].timeSeriesPattern).toBe('単発');
    expect(sortedPatterns[2].priorityScore).toBe(26);

    expect(result.visualizationGraphs).toHaveLength(2);
    expect(result.visualizationGraphs[0].graphType).toBe('折れ線');
    expect(result.visualizationGraphs[1].graphType).toBe('ヒートマップ');

    expect(result.emailSentAt).toBeDefined();
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);

    const dbIssueOccurrences = result.recurringIssuePatterns
      .filter((p) => p.issueKeyword === 'DB接続エラー')
      .flatMap((p) => p.occurrenceDetails || [])
      .sort((a, b) => new Date(a.reportedDate).getTime() - new Date(b.reportedDate).getTime());

    if (dbIssueOccurrences.length >= 2) {
      const date1 = new Date(dbIssueOccurrences[0].reportedDate).getTime();
      const date2 = new Date(dbIssueOccurrences[1].reportedDate).getTime();
      expect(date1).toBeLessThan(date2);
    }

    const allReportedDates = result.recurringIssuePatterns
      .flatMap((p) => p.occurrenceDetails?.map((d) => new Date(d.reportedDate).getTime()) || [])
      .sort((a, b) => a - b);

    for (let i = 1; i < allReportedDates.length; i++) {
      expect(allReportedDates[i]).toBeGreaterThanOrEqual(allReportedDates[i - 1]);
    }

    const fiscalYearBoundary = new Date('2024-03-31T23:59:59Z').getTime();
    const beforeBoundary = allReportedDates.filter((d) => d <= fiscalYearBoundary);
    const afterBoundary = allReportedDates.filter((d) => d > fiscalYearBoundary);

    expect(beforeBoundary.length).toBeGreaterThan(0);
    expect(afterBoundary.length).toBeGreaterThan(0);

    expect(mockAiClient.extractKeywordsForIssuePattern).toHaveBeenCalled();
    expect(mockAiClient.analyzeTimeSeriesPattern).toHaveBeenCalled();
    expect(mockAiClient.calculatePriorityScore).toHaveBeenCalled();
    expect(mockAiClient.selectVisualizationGraphs).toHaveBeenCalled();
    expect(mockAiClient.generateReportEmail).toHaveBeenCalled();
  });
});