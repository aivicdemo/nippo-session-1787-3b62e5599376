import { evaluateInitialReportSubmission } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 初回テスト報告検証', () => {
  // SCEN-589
  test('reportData が null のとき RequiredFieldMissingError 例外をスロー', () => {
    const input = {
      reportId: 'report-001',
      engineerId: 'eng-001',
      reportContent: '昨日の実績です',
      submissionTimestamp: new Date('2024-01-15T08:00:00Z'),
      trainingCompletionDate: new Date('2024-01-14T17:00:00Z'),
      managerReviewNotes: undefined,
      reportData: null,
    };

    expect(() => evaluateInitialReportSubmission(input)).toThrow(/報告データが見つかりません/);
  });
});