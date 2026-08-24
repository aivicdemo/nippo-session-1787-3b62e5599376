import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateAndSendConfirmationEmail, type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';
import type { TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能', () => {
  let textAnalysisAdapterStub: TextAnalysisServiceAdapter;

  beforeEach(() => {
    textAnalysisAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };
  });

  // SCEN-447
  test('[error] 抽出された課題キーワードが空のとき処理を中止しエラーを返す', async () => {
    const confirmationEmailInput: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: [
        {
          reportId: 'report-001',
          reporterUserId: 'user-001',
          reporterName: 'Alice',
          yesterdayAccomplishment: 'Completed feature A',
          todayPlan: 'Work on feature B',
          challenges: 'Database connection timeout occurred',
          submissionDateTime: new Date('2024-01-15T08:30:00Z'),
        },
        {
          reportId: 'report-002',
          reporterUserId: 'user-002',
          reporterName: 'Bob',
          yesterdayAccomplishment: 'Fixed bug in module X',
          todayPlan: 'Code review for PR 123',
          challenges: 'API rate limit issue',
          submissionDateTime: new Date('2024-01-15T08:45:00Z'),
        },
      ],
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15'),
    };

    const result = await generateAndSendConfirmationEmail(
      confirmationEmailInput,
      textAnalysisAdapterStub
    );

    expect(result).toEqual(
      expect.objectContaining({
        emailId: expect.any(String),
        sentDateTime: expect.any(Date),
        extractedIssuesCount: 0,
        prioritizedIssuesList: [],
        submissionStatus: expect.objectContaining({
          submittedCount: 2,
          unsubmittedMemberNames: [],
        }),
        errorMessage: '課題キーワードが抽出されませんでした。日報の課題欄を確認してください',
        status: 'failed',
      })
    );

    expect(result.status).toBe('failed');
    expect(result.errorMessage).toMatch(/課題キーワード/);
  });
});