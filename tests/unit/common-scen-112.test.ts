import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';
import { type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/types';

describe('Analysis Reporting', () => {
  // SCEN-112
  test('generateMonthlyAnalysisReport generates monthly analysis report in correct format with all required sections', async () => {
    const mockReportOutput = {
      reportHeader: {
        generatedAt: '2024-01-08T09:00:00Z',
        targetWeek: '2024-W01',
        memberCount: 10,
        reportPeriod: '2024-01-01 to 2024-01-05'
      },
      issueSummary: {
        totalCount: 25,
        categoryBreakdown: {
          quality: 8,
          schedule: 12,
          safety: 5
        }
      },
      priorityIssuesList: {
        high: [
          {
            id: 'issue_001',
            title: 'Critical performance degradation',
            category: 'quality',
            occurrenceCount: 3,
            firstReportedDate: '2024-01-01',
            affectedMembers: 4,
            recommendedAction: 'Immediate root cause analysis and hotfix deployment'
          },
          {
            id: 'issue_002',
            title: 'Delivery deadline risk',
            category: 'schedule',
            occurrenceCount: 2,
            firstReportedDate: '2024-01-02',
            affectedMembers: 6,
            recommendedAction: 'Escalate to project manager and adjust resource allocation'
          }
        ],
        medium: [
          {
            id: 'issue_003',
            title: 'Code review backlog',
            category: 'quality',
            occurrenceCount: 4,
            firstReportedDate: '2024-01-01',
            affectedMembers: 3,
            recommendedAction: 'Establish peer review rotation schedule'
          },
          {
            id: 'issue_004',
            title: 'Documentation gaps',
            category: 'quality',
            occurrenceCount: 2,
            firstReportedDate: '2024-01-03',
            affectedMembers: 2,
            recommendedAction: 'Schedule documentation sprint'
          }
        ],
        low: [
          {
            id: 'issue_005',
            title: 'Minor UI inconsistencies',
            category: 'quality',
            occurrenceCount: 1,
            firstReportedDate: '2024-01-04',
            affectedMembers: 1,
            recommendedAction: 'Add to technical debt backlog'
          }
        ]
      },
      trendAnalysis: {
        newIssueCount: 7,
        recurrenceIssueCount: 5,
        mostFrequentCategory: 'schedule',
        categoryTrend: {
          quality: { previous: 10, current: 8, delta: -2 },
          schedule: { previous: 10, current: 12, delta: 2 },
          safety: { previous: 3, current: 5, delta: 2 }
        },
        resolutionRate: 0.72,
        averageResolutionDays: 2.5
      },
      recommendedActionSection: {
        priorityHighActions: [
          {
            issueId: 'issue_001',
            actionDescription: 'Perform immediate code review and identify performance bottlenecks',
            assignedTo: 'Technical Lead',
            targetResolutionDate: '2024-01-09',
            estimatedEffort: '1 day'
          },
          {
            issueId: 'issue_002',
            actionDescription: 'Reallocate 2 engineers to critical path tasks',
            assignedTo: 'Project Manager',
            targetResolutionDate: '2024-01-08',
            estimatedEffort: '4 hours'
          }
        ]
      },
      formatValidation: {
        isValidJson: true,
        isParseable: true,
        noPersonalIdentifiers: true,
        inputOutputCountMatch: true
      }
    };

    const mockAiClient: Tx6Imp1AiClient = {
      executeAction06GenerateReport: jest.fn().mockResolvedValue(mockReportOutput)
    };

    const inputData = {
      weekStart: new Date('2024-01-01'),
      weekEnd: new Date('2024-01-05'),
      extractedIssues: [
        {
          id: 'issue_001',
          title: 'Critical performance degradation',
          category: 'quality',
          priority: 'high',
          reportedBy: 'member_001',
          reportedDate: '2024-01-01',
          description: 'System response time exceeds SLA threshold'
        },
        {
          id: 'issue_002',
          title: 'Delivery deadline risk',
          category: 'schedule',
          priority: 'high',
          reportedBy: 'member_002',
          reportedDate: '2024-01-02',
          description: 'Feature development 15% behind schedule'
        },
        {
          id: 'issue_003',
          title: 'Code review backlog',
          category: 'quality',
          priority: 'medium',
          reportedBy: 'member_003',
          reportedDate: '2024-01-01',
          description: 'PR review queue exceeds 24 hours'
        },
        {
          id: 'issue_004',
          title: 'Documentation gaps',
          category: 'quality',
          priority: 'medium',
          reportedBy: 'member_004',
          reportedDate: '2024-01-03',
          description: 'API documentation outdated'
        },
        {
          id: 'issue_005',
          title: 'Minor UI inconsistencies',
          category: 'quality',
          priority: 'low',
          reportedBy: 'member_005',
          reportedDate: '2024-01-04',
          description: 'Button spacing varies across pages'
        }
      ],
      categoryBreakdown: {
        quality: 8,
        schedule: 12,
        safety: 5
      },
      frequencyAnalysis: {
        newIssues: 7,
        recurringIssues: 5
      },
      priorityScores: {
        high: 2,
        medium: 2,
        low: 1
      },
      memberCount: 10
    };

    const result = await generateMonthlyAnalysisReport(inputData, mockAiClient);

    // Validate report header structure
    expect(result.reportHeader).toBeDefined();
    expect(result.reportHeader.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.reportHeader.targetWeek).toBe('2024-W01');
    expect(result.reportHeader.memberCount).toBe(10);

    // Validate timestamp is current (within 5 seconds)
    const generatedTime = new Date(result.reportHeader.generatedAt).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = Math.abs(currentTime - generatedTime);
    expect(timeDiff).toBeLessThanOrEqual(5000);

    // Validate issue summary structure
    expect(result.issueSummary).toBeDefined();
    expect(result.issueSummary.totalCount).toBe(25);
    expect(Object.keys(result.issueSummary.categoryBreakdown).length).toBeGreaterThanOrEqual(3);
    expect(result.issueSummary.categoryBreakdown.quality).toBe(8);
    expect(result.issueSummary.categoryBreakdown.schedule).toBe(12);
    expect(result.issueSummary.categoryBreakdown.safety).toBe(5);

    // Validate priority issues list has three priority levels
    expect(result.priorityIssuesList.high).toBeDefined();
    expect(Array.isArray(result.priorityIssuesList.high)).toBe(true);
    expect(result.priorityIssuesList.high.length).toBeGreaterThan(0);

    expect(result.priorityIssuesList.medium).toBeDefined();
    expect(Array.isArray(result.priorityIssuesList.medium)).toBe(true);
    expect(result.priorityIssuesList.medium.length).toBeGreaterThan(0);

    expect(result.priorityIssuesList.low).toBeDefined();
    expect(Array.isArray(result.priorityIssuesList.low)).toBe(true);

    // Validate each high priority issue has recommended action
    for (const issue of result.priorityIssuesList.high) {
      expect(issue.recommendedAction).toBeDefined();
      expect(typeof issue.recommendedAction).toBe('string');
      expect(issue.recommendedAction.length).toBeGreaterThan(0);
    }

    // Validate trend analysis section
    expect(result.trendAnalysis).toBeDefined();
    expect(result.trendAnalysis.newIssueCount).toBe(7);
    expect(result.trendAnalysis.recurrenceIssueCount).toBe(5);
    expect(result.trendAnalysis.mostFrequentCategory).toBe('schedule');
    expect(typeof result.trendAnalysis.resolutionRate).toBe('number');
    expect(typeof result.trendAnalysis.averageResolutionDays).toBe('number');

    // Validate recommended action section
    expect(result.recommendedActionSection).toBeDefined();
    expect(result.recommendedActionSection.priorityHighActions).toBeDefined();
    expect(Array.isArray(result.recommendedActionSection.priorityHighActions)).toBe(true);
    for (const action of result.recommendedActionSection.priorityHighActions) {
      expect(action.issueId).toBeDefined();
      expect(action.actionDescription).toBeDefined();
      expect(action.actionDescription.length).toBeGreaterThan(0);
    }

    // Validate no personal identifiers (member names, IDs, etc. should not be in report)
    const reportJson = JSON.stringify(result);
    expect(reportJson).not.toMatch(/member_\d{3}/);

    // Validate format validation
    expect(result.formatValidation).toBeDefined();
    expect(result.formatValidation.isValidJson).toBe(true);
    expect(result.formatValidation.isParseable).toBe(true);
    expect(result.formatValidation.noPersonalIdentifiers).toBe(true);
    expect(result.formatValidation.inputOutputCountMatch).toBe(true);

    // Validate total issue count matches input count
    const highCount = result.priorityIssuesList.high.length;
    const mediumCount = result.priorityIssuesList.medium.length;
    const lowCount = result.priorityIssuesList.low.length;
    const totalIssuesInReport = highCount + mediumCount + lowCount;
    expect(totalIssuesInReport).toBe(inputData.extractedIssues.length);

    // Validate AI client was called with correct action
    expect(mockAiClient.executeAction06GenerateReport).toHaveBeenCalled();
  });
});