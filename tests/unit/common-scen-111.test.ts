import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';

describe('共通: 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-111
  test('should execute priority scoring action (Action 5) correctly during monthly analysis report generation', async () => {
    const mockReportData = [
      {
        reportId: 'report_001',
        memberId: 'member_001',
        date: '2024-01-08',
        content: 'Completed API integration. Issue: database connection timeout during peak hours.',
        issues: ['database connection timeout'],
        status: 'submitted'
      },
      {
        reportId: 'report_002',
        memberId: 'member_002',
        date: '2024-01-08',
        content: 'Fixed UI layout bug. Issue: performance degradation in list rendering.',
        issues: ['performance degradation'],
        status: 'submitted'
      },
      {
        reportId: 'report_003',
        memberId: 'member_003',
        date: '2024-01-08',
        content: 'Deployed to production. Issue: customer reported data loss in batch process.',
        issues: ['customer data loss'],
        status: 'submitted'
      },
      {
        reportId: 'report_004',
        memberId: 'member_004',
        date: '2024-01-08',
        content: 'Code review completed. Issue: security vulnerability in authentication module.',
        issues: ['security vulnerability'],
        status: 'submitted'
      },
      {
        reportId: 'report_005',
        memberId: 'member_005',
        date: '2024-01-08',
        content: 'Documentation updated. Issue: unclear API specification for third-party integration.',
        issues: ['unclear API specification'],
        status: 'submitted'
      }
    ];

    const mockMetadata = {
      analysisMonth: '2024-01',
      analysisWeek: 'week_01',
      collectionStartDate: '2024-01-01',
      collectionEndDate: '2024-01-07',
      totalReportsCollected: 5,
      unsubmittedMembers: []
    };

    const mockAiClient = {
      buildAction05Prompt: jest.fn().mockReturnValue({
        version: 'ACTION_05_PROMPT_VERSION_1.0',
        prompt: 'Score the following issues by priority (1-10)...'
      }),
      callAiForAction05: jest.fn().mockResolvedValue({
        scoringResults: [
          {
            issueId: 'issue_003',
            issueText: 'customer reported data loss in batch process',
            priorityScore: 9,
            scoreRationale: 'Customer data loss impacts business operations and trust. High severity.',
            scoringTimestamp: '2024-01-08T10:30:00Z'
          },
          {
            issueId: 'issue_004',
            issueText: 'security vulnerability in authentication module',
            priorityScore: 8,
            scoreRationale: 'Security vulnerability poses direct risk to system and user data. High priority.',
            scoringTimestamp: '2024-01-08T10:30:15Z'
          },
          {
            issueId: 'issue_001',
            issueText: 'database connection timeout during peak hours',
            priorityScore: 7,
            scoreRationale: 'Performance issue affects user experience during peak usage.',
            scoringTimestamp: '2024-01-08T10:30:30Z'
          },
          {
            issueId: 'issue_002',
            issueText: 'performance degradation in list rendering',
            priorityScore: 5,
            scoreRationale: 'UI performance issue, medium impact on user experience.',
            scoringTimestamp: '2024-01-08T10:30:45Z'
          },
          {
            issueId: 'issue_005',
            issueText: 'unclear API specification for third-party integration',
            priorityScore: 3,
            scoreRationale: 'Documentation issue, low immediate impact but affects future development.',
            scoringTimestamp: '2024-01-08T10:31:00Z'
          }
        ]
      })
    };

    const startTime = Date.now();
    const result = await generateMonthlyAnalysisReport(mockReportData, mockMetadata, mockAiClient);
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalled();
    expect(mockAiClient.callAiForAction05).toHaveBeenCalled();

    expect(result).toBeDefined();
    expect(result.scoringResults).toBeDefined();
    expect(Array.isArray(result.scoringResults)).toBe(true);
    expect(result.scoringResults.length).toBe(5);

    expect(result.scoringResults[0].priorityScore).toBe(9);
    expect(result.scoringResults[1].priorityScore).toBe(8);
    expect(result.scoringResults[2].priorityScore).toBe(7);
    expect(result.scoringResults[3].priorityScore).toBe(5);
    expect(result.scoringResults[4].priorityScore).toBe(3);

    for (let i = 0; i < result.scoringResults.length - 1; i++) {
      expect(result.scoringResults[i].priorityScore).toBeGreaterThanOrEqual(result.scoringResults[i + 1].priorityScore);
    }

    expect(result.scoringResults[0]).toHaveProperty('issueId');
    expect(result.scoringResults[0]).toHaveProperty('issueText');
    expect(result.scoringResults[0]).toHaveProperty('priorityScore');
    expect(result.scoringResults[0]).toHaveProperty('scoreRationale');
    expect(result.scoringResults[0]).toHaveProperty('scoringTimestamp');

    expect(result.scoringResults[0].scoreRationale).toMatch(/Customer data loss/);
    expect(result.scoringResults[0].scoringTimestamp).toBe('2024-01-08T10:30:00Z');

    expect(result.nextActionStatus).toBe('Action 6 transition prepared');

    expect(executionTime).toBeLessThan(30000);
  });
});