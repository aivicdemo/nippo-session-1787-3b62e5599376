import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput, AggregatedDailyReport, PrioritizedIssue } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail - Idempotent Issue Priority Ordering', () => {
  // SCEN-435
  test('should generate confirmation emails with identical issue priority order on repeated executions with same dataset', async () => {
    // Setup: Mock aggregated reports from 10 team members
    const aggregatedReports: AggregatedDailyReport[] = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-001',
        reporterName: 'Alice',
        yesterdayAccomplishment: 'Completed API integration testing',
        todayPlan: 'Deploy API to staging environment',
        challenges: 'Database connection timeout issues persist',
        submissionDateTime: new Date('2024-01-15T08:30:00Z'),
      },
      {
        reportId: 'report-002',
        reporterUserId: 'user-002',
        reporterName: 'Bob',
        yesterdayAccomplishment: 'Fixed UI layout bugs',
        todayPlan: 'Implement responsive design for mobile',
        challenges: 'Database connection timeout issues, Browser compatibility issues',
        submissionDateTime: new Date('2024-01-15T08:35:00Z'),
      },
      {
        reportId: 'report-003',
        reporterUserId: 'user-003',
        reporterName: 'Charlie',
        yesterdayAccomplishment: 'Code review for feature branch',
        todayPlan: 'Merge feature to main branch',
        challenges: 'Performance degradation in query processing',
        submissionDateTime: new Date('2024-01-15T08:40:00Z'),
      },
      {
        reportId: 'report-004',
        reporterUserId: 'user-004',
        reporterName: 'Diana',
        yesterdayAccomplishment: 'Documentation update',
        todayPlan: 'API documentation finalization',
        challenges: 'Database connection timeout issues, Team coordination delay',
        submissionDateTime: new Date('2024-01-15T08:45:00Z'),
      },
      {
        reportId: 'report-005',
        reporterUserId: 'user-005',
        reporterName: 'Edward',
        yesterdayAccomplishment: 'Security audit completed',
        todayPlan: 'Implement security patches',
        challenges: 'Insufficient server resources',
        submissionDateTime: new Date('2024-01-15T08:50:00Z'),
      },
      {
        reportId: 'report-006',
        reporterUserId: 'user-006',
        reporterName: 'Frank',
        yesterdayAccomplishment: 'Database schema optimization',
        todayPlan: 'Performance tuning for queries',
        challenges: 'Database connection timeout issues, Performance degradation in query processing',
        submissionDateTime: new Date('2024-01-15T08:55:00Z'),
      },
      {
        reportId: 'report-007',
        reporterUserId: 'user-007',
        reporterName: 'Grace',
        yesterdayAccomplishment: 'Infrastructure provisioning',
        todayPlan: 'Setup monitoring and alerting',
        challenges: 'Insufficient server resources, Infrastructure scaling needed',
        submissionDateTime: new Date('2024-01-15T09:00:00Z'),
      },
      {
        reportId: 'report-008',
        reporterUserId: 'user-008',
        reporterName: 'Henry',
        yesterdayAccomplishment: 'Team training session preparation',
        todayPlan: 'Conduct training for new framework',
        challenges: 'Team coordination delay',
        submissionDateTime: new Date('2024-01-15T09:05:00Z'),
      },
      {
        reportId: 'report-009',
        reporterUserId: 'user-009',
        reporterName: 'Iris',
        yesterdayAccomplishment: 'Requirement gathering with stakeholders',
        todayPlan: 'Feature specification finalization',
        challenges: 'Requirement ambiguity, Team coordination delay',
        submissionDateTime: new Date('2024-01-15T09:10:00Z'),
      },
      {
        reportId: 'report-010',
        reporterUserId: 'user-010',
        reporterName: 'Jack',
        yesterdayAccomplishment: 'Test automation framework setup',
        todayPlan: 'Write automated test cases',
        challenges: 'Test coverage gap, Browser compatibility issues',
        submissionDateTime: new Date('2024-01-15T09:15:00Z'),
      },
    ];

    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const analysisDate = new Date('2024-01-15T00:00:00Z');
    const managerUserId = 'manager-001';
    const teamId = 'team-001';

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // Consistent extraction logic
        const keywords: { keyword: string; frequency: number }[] = [];
        if (text.includes('Database connection timeout')) {
          keywords.push({ keyword: 'Database connection timeout issues', frequency: 4 });
        }
        if (text.includes('Performance degradation')) {
          keywords.push({ keyword: 'Performance degradation in query processing', frequency: 2 });
        }
        if (text.includes('Insufficient server resources')) {
          keywords.push({ keyword: 'Insufficient server resources', frequency: 2 });
        }
        if (text.includes('Team coordination')) {
          keywords.push({ keyword: 'Team coordination delay', frequency: 3 });
        }
        if (text.includes('Browser compatibility')) {
          keywords.push({ keyword: 'Browser compatibility issues', frequency: 2 });
        }
        if (text.includes('Requirement ambiguity')) {
          keywords.push({ keyword: 'Requirement ambiguity', frequency: 1 });
        }
        if (text.includes('Infrastructure scaling')) {
          keywords.push({ keyword: 'Infrastructure scaling needed', frequency: 1 });
        }
        if (text.includes('Test coverage')) {
          keywords.push({ keyword: 'Test coverage gap', frequency: 1 });
        }
        return keywords;
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        // Consistent impact assessment
        const scoreMap: Record<string, number> = {
          'Database connection timeout issues': 85,
          'Performance degradation in query processing': 72,
          'Insufficient server resources': 68,
          'Team coordination delay': 55,
          'Browser compatibility issues': 45,
          'Requirement ambiguity': 35,
          'Infrastructure scaling needed': 60,
          'Test coverage gap': 50,
        };
        return scoreMap[keyword] || 30;
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        // Consistent severity classification
        const severityMap: Record<string, 'HIGH' | 'MEDIUM' | 'LOW'> = {
          'Database connection timeout issues': 'HIGH',
          'Performance degradation in query processing': 'MEDIUM',
          'Insufficient server resources': 'MEDIUM',
          'Team coordination delay': 'MEDIUM',
          'Browser compatibility issues': 'LOW',
          'Requirement ambiguity': 'LOW',
          'Infrastructure scaling needed': 'MEDIUM',
          'Test coverage gap': 'LOW',
        };
        return severityMap[keyword] || 'LOW';
      }),
    };

    const managerEmail = 'manager@company.com';

    // First execution
    const firstExecutionInput: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId,
      teamId,
      analysisDate,
    };

    const firstResult = await generateAndSendConfirmationEmail(
      firstExecutionInput,
      mockTextAnalysisAdapter as any,
      { getManagerEmail: jest.fn().mockResolvedValue(managerEmail) } as any
    );

    // Extract issue priority order from first execution
    const firstPrioritizedIssues = firstResult.prioritizedIssuesList;
    const firstIssueOrder = firstPrioritizedIssues.map((issue: PrioritizedIssue) => ({
      content: issue.content,
      priorityRank: issue.priorityRank,
      impactScore: issue.impactScore,
    }));

    // Second execution with same data
    const secondResult = await generateAndSendConfirmationEmail(
      firstExecutionInput,
      mockTextAnalysisAdapter as any,
      { getManagerEmail: jest.fn().mockResolvedValue(managerEmail) } as any
    );

    // Extract issue priority order from second execution
    const secondPrioritizedIssues = secondResult.prioritizedIssuesList;
    const secondIssueOrder = secondPrioritizedIssues.map((issue: PrioritizedIssue) => ({
      content: issue.content,
      priorityRank: issue.priorityRank,
      impactScore: issue.impactScore,
    }));

    // Verify identical priority ordering
    expect(firstIssueOrder.length).toBe(secondIssueOrder.length);
    
    firstIssueOrder.forEach((firstIssue: any, index: number) => {
      const secondIssue = secondIssueOrder[index];
      expect(firstIssue.content).toBe(secondIssue.content);
      expect(firstIssue.priorityRank).toBe(secondIssue.priorityRank);
      expect(firstIssue.impactScore).toBe(secondIssue.impactScore);
    });

    // Verify consistent output structure
    expect(firstResult.emailId).toBeDefined();
    expect(firstResult.sentDateTime).toBeDefined();
    expect(firstResult.extractedIssuesCount).toBe(8);
    expect(secondResult.extractedIssuesCount).toBe(8);

    // Verify submission status summary consistency
    expect(firstResult.submissionStatus.submittedCount).toBe(10);
    expect(secondResult.submissionStatus.submittedCount).toBe(10);
    expect(firstResult.submissionStatus.unsubmittedMemberNames).toEqual(
      secondResult.submissionStatus.unsubmittedMemberNames
    );

    // Verify priority ranking consistency (HIGH issues should come first)
    const firstHighPriorityCount = firstPrioritizedIssues.filter(
      (issue: PrioritizedIssue) => issue.priorityRank === 'HIGH'
    ).length;
    const secondHighPriorityCount = secondPrioritizedIssues.filter(
      (issue: PrioritizedIssue) => issue.priorityRank === 'HIGH'
    ).length;
    expect(firstHighPriorityCount).toBe(secondHighPriorityCount);
    expect(firstHighPriorityCount).toBe(1);

    // Verify that Database connection timeout issue appears first in both executions
    expect(firstPrioritizedIssues[0].content).toContain('Database connection timeout');
    expect(secondPrioritizedIssues[0].content).toContain('Database connection timeout');
    expect(firstPrioritizedIssues[0].impactScore).toBe(85);
    expect(secondPrioritizedIssues[0].impactScore).toBe(85);
  });
});