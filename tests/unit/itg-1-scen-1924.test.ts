import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('TX8 Agent - Recurring Issue Pattern Analysis with TextAnalysisServiceAdapter Failure Recovery', () => {
  // SCEN-1924
  test('should fallback to manual grouping when TextAnalysisServiceAdapter fails 3 times consecutively', async () => {
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    let callCount = 0;
    const failedAttempts: Array<{ attemptNumber: number; timestamp: string }> = [];
    const retryTimestamps: number[] = [];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        callCount++;
        const now = new Date().toISOString();
        failedAttempts.push({
          attemptNumber: callCount,
          timestamp: now,
        });
        retryTimestamps.push(Date.now());

        if (callCount === 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          throw new Error('Timeout: API call failed after 30000ms');
        }
        if (callCount === 2) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          throw new Error('Timeout: API call failed after 30000ms');
        }
        if (callCount === 3) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          throw new Error('Timeout: API call failed after 30000ms');
        }

        return {
          keywords: [
            { keyword: 'システム障害', frequency: 2, confidenceScore: 0.95 },
            { keyword: '再発', frequency: 2, confidenceScore: 0.88 },
          ],
        };
      }),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 85,
      })),
      classifyIssueSeverity: jest.fn(async () => ({
        severity: 'high',
      })),
    };

    const mockIssueKeywordRepository = {
      findByKeywordText: jest.fn(async (text: string) => {
        if (text === 'システム障害') {
          return {
            issueKeywordId: 'keyword-001',
            keywordText: 'システム障害',
            category: 'infrastructure',
            createdAt: '2023-12-01T00:00:00Z',
          };
        }
        return null;
      }),
      findAll: jest.fn(async () => [
        {
          issueKeywordId: 'keyword-001',
          keywordText: 'システム障害',
          category: 'infrastructure',
          createdAt: '2023-12-01T00:00:00Z',
        },
        {
          issueKeywordId: 'keyword-002',
          keywordText: '再発',
          category: 'pattern',
          createdAt: '2023-12-01T00:00:00Z',
        },
      ]),
    };

    const mockRecurringIssueGroupRepository = {
      findByGroupId: jest.fn(async () => ({
        groupId: 'group-001',
        groupName: 'システム障害関連',
        issueKeywordIds: ['keyword-001'],
        createdAt: '2023-12-01T00:00:00Z',
      })),
      create: jest.fn(async (groupData: any) => ({
        ...groupData,
        groupId: 'group-001',
        createdAt: '2024-01-08T09:00:00Z',
      })),
    };

    const mockManualGroupingResultRepository = {
      create: jest.fn(async (result: any) => ({
        ...result,
        recordId: 'manual-group-001',
        recordedAt: '2024-01-08T09:15:00Z',
      })),
    };

    const mockDashboardMessageService = {
      displayMessage: jest.fn(),
    };

    const aiClient = {
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
      issueKeywordRepository: mockIssueKeywordRepository,
      recurringIssueGroupRepository: mockRecurringIssueGroupRepository,
      manualGroupingResultRepository: mockManualGroupingResultRepository,
      dashboardMessageService: mockDashboardMessageService,
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const dailyReportData = [
      {
        reporterId: 'engineer-001',
        reportDate: '2024-01-08',
        issueDescription:
          'システム障害が再度発生した。先月も同じ現象があった',
      },
    ];

    const result = await runTx8Imp1Agent(input, aiClient, dailyReportData);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('recurringIssuePatterns');
    expect(result).toHaveProperty('visualizationGraphs');
    expect(result).toHaveProperty('emailSentAt');

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    expect(failedAttempts).toHaveLength(3);
    expect(failedAttempts[0].attemptNumber).toBe(1);
    expect(failedAttempts[1].attemptNumber).toBe(2);
    expect(failedAttempts[2].attemptNumber).toBe(3);

    expect(mockManualGroupingResultRepository.create).toHaveBeenCalled();
    const manualGroupingCall = mockManualGroupingResultRepository.create.mock
      .calls[0][0];
    expect(manualGroupingCall).toHaveProperty('groupId', 'group-001');
    expect(manualGroupingCall).toHaveProperty('matchedKeyword', 'システム障害');
    expect(manualGroupingCall).toHaveProperty('groupingMethod', 'manual_auto_failed');

    expect(mockDashboardMessageService.displayMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '課題分析が一時的に利用できません。手動入力をご利用ください',
        messageType: 'warning',
      })
    );

    expect(result.recurringIssuePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issueKeyword: expect.any(String),
          occurrenceCount: expect.any(Number),
          timeSeriesPattern: expect.any(String),
          priorityScore: expect.any(Number),
        }),
      ])
    );

    expect(result.visualizationGraphs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          graphType: expect.any(String),
          title: expect.any(String),
          dataPoints: expect.any(Array),
        }),
      ])
    );

    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeLessThanOrEqual(Date.now());
  });
});