import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { submitReport } from '../../src/logic/report-submission-management';
import type { SubmitReportInput } from '../../src/logic/report-submission-management';

describe('submitReport - validation and deadline handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-301: エンジニアが日報を送信する際に、抱えている課題が500文字を超える場合、入力検証エラーをスロー
  test('should throw ValidationError when issuesAndConcerns exceeds 500 characters', () => {
    const inputData: SubmitReportInput = {
      reporterId: 'engineer-001',
      teamId: 'team-A',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'Completed feature implementation and code review for module A.',
      todayPlan: 'Begin integration testing and prepare documentation for upcoming release.',
      issuesAndConcerns: 'a'.repeat(501),
    };

    expect(() => submitReport(inputData)).toThrow(/課題は500文字以内で入力してください/);
  });
});