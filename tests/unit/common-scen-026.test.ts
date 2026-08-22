import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  test('SCEN-026: Action 3 extracts and classifies tasks from submitted reports', async () => {
    // Prepare mock submitted report data with 5 reports
    const mockSubmittedReports = [
      {
        reportId: 'report-001',
        reporterName: 'Alice',
        submittedAt: '2024-01-15T09:00:00Z',
        yesterdayAccomplishments: 'Completed feature A implementation',
        todayPlans: 'Review code for feature B',
        chalenges: 'Database connection timeout during testing'
      },
      {
        reportId: 'report-002',
        reporterName: 'Bob',
        submittedAt: '2024-01-15T09:15:00Z',
        yesterdayAccomplishments: 'Fixed bug in module X',
        todayPlans: 'Deploy to staging environment',
        chalenges: 'Database connection timeout - same issue'
      },
      {
        reportId: 'report-003',
        reporterName: 'Carol',
        submittedAt: '2024-01-15T09:30:00Z',
        yesterdayAccomplishments: 'Wrote unit tests for component Y',
        todayPlans: 'Integration testing',
        chalenges: 'Insufficient resource allocation for testing team'
      },
      {
        reportId: 'report-004',
        reporterName: 'David',
        submittedAt: '2024-01-15T09:45:00Z',
        yesterdayAccomplishments: 'Updated documentation',
        todayPlans: 'Conduct user training session',
        chalenges: 'Process improvement needed for deployment'
      },
      {
        reportId: 'report-005',
        reporterName: 'Eve',
        submittedAt: '2024-01-15T10:00:00Z',
        yesterdayAccomplishments: 'Monitored system performance',
        todayPlans: 'Analyze performance metrics',
        chalenges: 'System performance degradation under load'
      }
    ];

    // Define predefined task categories that are allowed
    const allowedCategories = [
      'システム障害',
      'プロセス改善',
      'リソース不足',
      'その他'
    ];

    // Mock AI client that returns structured extracted tasks
    const mockAiClient = {
      callAction03: jest.fn(async (prompt: string) => {
        return {
          extractedTasks: [
            {
              taskTitle: 'Database connection timeout',
              reporterName: 'Alice',
              taskDescription: 'Database connection timeout during testing',
              category: 'システム障害'
            },
            {
              taskTitle: 'Database connection timeout',
              reporterName: 'Bob',
              taskDescription: 'Database connection timeout - same issue',
              category: 'システム障害'
            },
            {
              taskTitle: 'Insufficient resource allocation',
              reporterName: 'Carol',
              taskDescription: 'Insufficient resource allocation for testing team',
              category: 'リソース不足'
            },
            {
              taskTitle: 'Deployment process improvement',
              reporterName: 'David',
              taskDescription: 'Process improvement needed for deployment',
              category: 'プロセス改善'
            },
            {
              taskTitle: 'System performance degradation',
              reporterName: 'Eve',
              taskDescription: 'System performance degradation under load',
              category: 'システム障害'
            }
          ]
        };
      })
    };

    // Call the function to test
    const result = await detectAndNotifyUnsubmitted(
      mockSubmittedReports,
      mockAiClient as any
    );

    // Verify that Action 03 was triggered and called
    expect(mockAiClient.callAction03).toHaveBeenCalled();

    // Verify the prompt contains submitted report challenges
    const callArgs = mockAiClient.callAction03.mock.calls[0][0];
    expect(callArgs).toContain('Database connection timeout during testing');
    expect(callArgs).toContain('Insufficient resource allocation for testing team');
    expect(callArgs).toContain('Process improvement needed for deployment');
    expect(callArgs).toContain('System performance degradation under load');

    // Verify extracted tasks structure
    expect(result.extractedTasks).toHaveLength(5);

    // Verify task 1: Database issue from Alice
    expect(result.extractedTasks[0]).toEqual({
      taskTitle: 'Database connection timeout',
      reporterName: 'Alice',
      taskDescription: 'Database connection timeout during testing',
      category: 'システム障害'
    });

    // Verify task 2: Duplicate database issue from Bob is recognized as same task
    expect(result.extractedTasks[1]).toEqual({
      taskTitle: 'Database connection timeout',
      reporterName: 'Bob',
      taskDescription: 'Database connection timeout - same issue',
      category: 'システム障害'
    });

    // Verify task 3: Resource allocation from Carol
    expect(result.extractedTasks[2]).toEqual({
      taskTitle: 'Insufficient resource allocation',
      reporterName: 'Carol',
      taskDescription: 'Insufficient resource allocation for testing team',
      category: 'リソース不足'
    });

    // Verify task 4: Process improvement from David
    expect(result.extractedTasks[3]).toEqual({
      taskTitle: 'Deployment process improvement',
      reporterName: 'David',
      taskDescription: 'Process improvement needed for deployment',
      category: 'プロセス改善'
    });

    // Verify task 5: Performance issue from Eve
    expect(result.extractedTasks[4]).toEqual({
      taskTitle: 'System performance degradation',
      reporterName: 'Eve',
      taskDescription: 'System performance degradation under load',
      category: 'システム障害'
    });

    // Verify all extracted tasks have valid predefined categories
    result.extractedTasks.forEach((task) => {
      expect(allowedCategories).toContain(task.category);
    });

    // Verify correspondence between extracted tasks and original report challenges
    const taskDescriptions = result.extractedTasks.map(t => t.taskDescription);
    expect(taskDescriptions).toContain('Database connection timeout during testing');
    expect(taskDescriptions).toContain('Insufficient resource allocation for testing team');
    expect(taskDescriptions).toContain('Process improvement needed for deployment');
    expect(taskDescriptions).toContain('System performance degradation under load');

    // Verify duplicate recognition: both Alice and Bob reported database timeout
    const databaseTasks = result.extractedTasks.filter(
      t => t.taskTitle === 'Database connection timeout'
    );
    expect(databaseTasks).toHaveLength(2);
    expect(databaseTasks[0].reporterName).toBe('Alice');
    expect(databaseTasks[1].reporterName).toBe('Bob');
  });
});