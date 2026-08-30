import { describe, test, expect } from '@jest/globals';
import { evaluateInitialReportSubmission } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 初回テスト報告評価', () => {
  test('SCEN-590: 最小文字数の基準値が0以下のとき、FormatValidationErrorをスロー', () => {
    const reportData = [
      {
        reportId: 'report-001',
        engineerId: 'eng-001',
        yesterdayAccomplishment: 'This is yesterday work content',
        todayPlan: 'This is today plan content',
        issuesAndConcerns: 'This is an issue description',
        submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
        trainingPhaseId: 'phase-001'
      }
    ];

    const minContentLength = -1;
    const issueKeywords: string[] = [];

    expect(() => {
      evaluateInitialReportSubmission(
        reportData[0].reportId,
        reportData[0].engineerId,
        reportData[0].yesterdayAccomplishment,
        reportData[0].todayPlan,
        reportData[0].issuesAndConcerns,
        reportData[0].submissionTimestamp,
        reportData[0].trainingPhaseId
      );
    }).toThrow(/最小文字数/);
  });
});