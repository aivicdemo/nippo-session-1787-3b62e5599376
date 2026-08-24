import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput, PrioritizedIssue } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail with TextAnalysisServiceAdapter impact scoring', () => {
  it('SCEN-437: impact scores determine priority order in confirmation email', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['課題A', '課題B', '課題C'],
        frequencies: { '課題A': 3, '課題B': 2, '課題C': 1 }
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(60)
        .mockResolvedValueOnce(40),
      classifyIssueSeverity: jest.fn()
        .mockResolvedValueOnce('high')
        .mockResolvedValueOnce('medium')
        .mockResolvedValueOnce('low')
    };

    const aggregatedReports = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-001',
        reporterName: 'Engineer A',
        yesterdayAccomplishment: 'Completed feature X',
        todayPlan: 'Work on feature Y',
        challenges: '課題A: システムパフォーマンス低下',
        submissionDateTime: new Date('2024-01-15T08:30:00Z')
      },
      {
        reportId: 'report-002',
        reporterUserId: 'user-002',
        reporterName: 'Engineer B',
        yesterdayAccomplishment: 'Fixed bug Y',
        todayPlan: 'Code review',
        challenges: '課題B: テスト環境不安定',
        submissionDateTime: new Date('2024-01-15T08:45:00Z')
      },
      {
        reportId: 'report-003',
        reporterUserId: 'user-003',
        reporterName: 'Engineer C',
        yesterdayAccomplishment: 'Documentation update',
        todayPlan: 'Deploy to staging',
        challenges: '課題C: デプロイスクリプト要修正',
        submissionDateTime: new Date('2024-01-15T09:00:00Z')
      }
    ];

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:30:00Z'),
      aggregatedReports,
      managerUserId: 'manager-001',
      teamId: 'team-dev',
      analysisDate: new Date('2024-01-15')
    };

    const output: ConfirmationEmailOutput = await generateAndSendConfirmationEmail(
      input,
      mockTextAnalysisAdapter
    );

    expect(output.emailId).toBeDefined();
    expect(typeof output.emailId).toBe('string');
    expect(output.emailId).toMatch(/^email-/);

    expect(output.sentDateTime).toEqual(expect.any(Date));

    expect(output.extractedIssuesCount).toBe(3);

    expect(output.prioritizedIssuesList).toHaveLength(3);

    const issue1 = output.prioritizedIssuesList[0];
    expect(issue1.content).toBe('課題A');
    expect(issue1.priorityRank).toBe('high');
    expect(issue1.impactScore).toBe(85);

    const issue2 = output.prioritizedIssuesList[1];
    expect(issue2.content).toBe('課題B');
    expect(issue2.priorityRank).toBe('medium');
    expect(issue2.impactScore).toBe(60);

    const issue3 = output.prioritizedIssuesList[2];
    expect(issue3.content).toBe('課題C');
    expect(issue3.priorityRank).toBe('low');
    expect(issue3.impactScore).toBe(40);

    expect(output.submissionStatus.submittedCount).toBe(3);
    expect(output.submissionStatus.unsubmittedMemberNames).toHaveLength(0);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);
  });
});