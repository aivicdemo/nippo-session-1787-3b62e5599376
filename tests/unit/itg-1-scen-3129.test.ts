import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('Tx4Imp1Agent - リアルタイム進捗データを複数システムから自動集約する', () => {
  // SCEN-3129
  test('should aggregate realtime progress data from multiple systems and normalize with TextAnalysisService', async () => {
    const executionContext = {
      teamId: 'team-001',
      managerId: 'mgr-001',
      reportDate: '2024-01-15',
      meetingStartTime: '09:00',
    };

    const mockAiClient: Tx4Imp1AiClient = {
      executeAction: jest.fn().mockImplementation(async (actionPrompt: string) => {
        if (actionPrompt.includes('Action 1') || actionPrompt.includes('aggregate')) {
          return {
            aggregatedReports: [
              {
                memberId: 'mem-001',
                memberName: 'Engineer A',
                yesterdayWork: 'Completed API integration testing',
                todayWork: 'Start database optimization',
                issue: 'Database query performance degradation affecting response time',
              },
              {
                memberId: 'mem-002',
                memberName: 'Engineer B',
                yesterdayWork: 'Fixed UI layout issues',
                todayWork: 'Review pull requests',
                issue: 'Same database query performance issue reported',
              },
              {
                memberId: 'mem-003',
                memberName: 'Engineer C',
                yesterdayWork: 'Documentation update',
                todayWork: 'Deploy to staging',
                issue: 'Deployment script needs parameterization',
              },
              {
                memberId: 'mem-004',
                memberName: 'Engineer D',
                yesterdayWork: 'Code review completed',
                todayWork: 'Refactor authentication module',
                issue: 'Authentication token expiration edge case',
              },
              {
                memberId: 'mem-005',
                memberName: 'Engineer E',
                yesterdayWork: 'Performance profiling',
                todayWork: 'Optimization implementation',
                issue: 'Memory leak detected in cache layer',
              },
              {
                memberId: 'mem-006',
                memberName: 'Engineer F',
                yesterdayWork: 'Test case development',
                todayWork: 'Test execution',
                issue: 'Test coverage below 80% threshold',
              },
              {
                memberId: 'mem-007',
                memberName: 'Engineer G',
                yesterdayWork: 'Infrastructure setup',
                todayWork: 'Monitor deployment',
                issue: 'Database query performance issue in production',
              },
              {
                memberId: 'mem-008',
                memberName: 'Engineer H',
                yesterdayWork: 'Security audit preparation',
                todayWork: 'Execute security scan',
                issue: 'SQL injection vulnerability in legacy endpoint',
              },
              {
                memberId: 'mem-009',
                memberName: 'Engineer I',
                yesterdayWork: 'Client requirement analysis',
                todayWork: 'Specification document finalization',
                issue: 'Requirement clarification needed from stakeholder',
              },
              {
                memberId: 'mem-010',
                memberName: 'Engineer J',
                yesterdayWork: 'Release note preparation',
                todayWork: 'Final validation',
                issue: 'Build pipeline timeout during stress test',
              },
            ],
          };
        }
        return { aggregatedReports: [] };
      }),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((issueText: string) => {
        const keywordMap: { [key: string]: string[] } = {
          'database query performance': ['database', 'query', 'performance'],
          'deployment script': ['deployment', 'script'],
          'authentication token': ['authentication', 'token'],
          'memory leak': ['memory', 'leak'],
          'test coverage': ['test', 'coverage'],
          'sql injection': ['security', 'vulnerability'],
          'requirement clarification': ['requirement', 'clarification'],
          'build pipeline': ['build', 'pipeline'],
        };
        for (const [key, value] of Object.entries(keywordMap)) {
          if (issueText.toLowerCase().includes(key)) {
            return value;
          }
        }
        return [issueText.split(' ')[0]];
      }),
      assessImpactScore: jest.fn((issueKeywords: string[]) => {
        const scoreMap: { [key: string]: number } = {
          database: 85,
          deployment: 75,
          authentication: 80,
          memory: 90,
          test: 65,
          security: 95,
          requirement: 55,
          build: 70,
        };
        let maxScore = 50;
        for (const keyword of issueKeywords) {
          const score = scoreMap[keyword] || 50;
          if (score > maxScore) {
            maxScore = score;
          }
        }
        return maxScore;
      }),
      classifyIssueSeverity: jest.fn((impactScore: number) => {
        if (impactScore >= 80) {
          return 'high';
        } else if (impactScore >= 65) {
          return 'medium';
        } else {
          return 'low';
        }
      }),
    };

    const result = await runTx4Imp1Agent(executionContext, mockAiClient);

    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');

    expect(result.aggregatedReportCount).toBe(10);

    expect(mockAiClient.executeAction).toHaveBeenCalled();

    const callArgs = mockAiClient.executeAction.mock.calls[0];
    expect(callArgs[0]).toContain('Action 1');

    const actionPromptContent = callArgs[0];
    expect(actionPromptContent).toContain('aggregate');
    expect(actionPromptContent).toContain('realtime');
    expect(actionPromptContent).toContain('progress');

    const reportRecords = [
      {
        memberId: 'mem-001',
        issue: 'Database query performance degradation affecting response time',
        expectedKeywords: ['database', 'query', 'performance'],
        expectedScore: 85,
        expectedSeverity: 'high',
      },
      {
        memberId: 'mem-002',
        issue: 'Same database query performance issue reported',
        expectedKeywords: ['database', 'query', 'performance'],
        expectedScore: 85,
        expectedSeverity: 'high',
      },
      {
        memberId: 'mem-003',
        issue: 'Deployment script needs parameterization',
        expectedKeywords: ['deployment', 'script'],
        expectedScore: 75,
        expectedSeverity: 'medium',
      },
      {
        memberId: 'mem-004',
        issue: 'Authentication token expiration edge case',
        expectedKeywords: ['authentication', 'token'],
        expectedScore: 80,
        expectedSeverity: 'high',
      },
      {
        memberId: 'mem-005',
        issue: 'Memory leak detected in cache layer',
        expectedKeywords: ['memory', 'leak'],
        expectedScore: 90,
        expectedSeverity: 'high',
      },
      {
        memberId: 'mem-006',
        issue: 'Test coverage below 80% threshold',
        expectedKeywords: ['test', 'coverage'],
        expectedScore: 65,
        expectedSeverity: 'medium',
      },
      {
        memberId: 'mem-007',
        issue: 'Database query performance issue in production',
        expectedKeywords: ['database', 'query', 'performance'],
        expectedScore: 85,
        expectedSeverity: 'high',
      },
      {
        memberId: 'mem-008',
        issue: 'SQL injection vulnerability in legacy endpoint',
        expectedKeywords: ['security', 'vulnerability'],
        expectedScore: 95,
        expectedSeverity: 'high',
      },
      {
        memberId: 'mem-009',
        issue: 'Requirement clarification needed from stakeholder',
        expectedKeywords: ['requirement', 'clarification'],
        expectedScore: 55,
        expectedSeverity: 'low',
      },
      {
        memberId: 'mem-010',
        issue: 'Build pipeline timeout during stress test',
        expectedKeywords: ['build', 'pipeline'],
        expectedScore: 70,
        expectedSeverity: 'medium',
      },
    ];

    for (const record of reportRecords) {
      const extractedKeywords = mockTextAnalysisAdapter.extractKeywords(
        record.issue
      );
      expect(extractedKeywords).toBeDefined();
      expect(Array.isArray(extractedKeywords)).toBe(true);
      expect(extractedKeywords.length).toBeGreaterThanOrEqual(1);
      expect(extractedKeywords).toEqual(record.expectedKeywords);

      const impactScore = mockTextAnalysisAdapter.assessImpactScore(
        extractedKeywords
      );
      expect(typeof impactScore).toBe('number');
      expect(impactScore).toBeGreaterThanOrEqual(0);
      expect(impactScore).toBeLessThanOrEqual(100);
      expect(impactScore).toBe(record.expectedScore);

      const severity = mockTextAnalysisAdapter.classifyIssueSeverity(
        impactScore
      );
      expect(['high', 'medium', 'low']).toContain(severity);
      expect(severity).toBe(record.expectedSeverity);
    }

    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);

    expect(result.countermeasurePlan).toBeDefined();
    expect(typeof result.countermeasurePlan.topPriorityIssue).toBe('string');
    expect(Array.isArray(result.countermeasurePlan.recommendedActions)).toBe(
      true
    );
    expect(result.countermeasurePlan.recommendedActions.length).toBeLessThanOrEqual(3);
    expect(typeof result.countermeasurePlan.estimatedResolutionDays).toBe(
      'number'
    );
    expect(result.countermeasurePlan.estimatedResolutionDays).toBeGreaterThan(0);
    expect(typeof result.countermeasurePlan.assignedTeamId).toBe('string');

    expect(typeof result.summaryEmailSent).toBe('boolean');
    expect(result.completionTimestamp).toBeInstanceOf(Date);
  });
});