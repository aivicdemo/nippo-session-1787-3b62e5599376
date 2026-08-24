import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2535: [edge] 初回テスト報告の入力検証機能 - 報告テキストの文字数が 1 文字である場合、品質基準検証が合格となる
  test('1文字の報告テキストが品質基準検証に合格し、送信可能な状態になること', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['test'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 50,
        severity: 'medium' as const,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        severity: 'low' as const,
        confidence: 0.8,
      }),
    };

    const input = {
      reportId: 'report-001',
      userId: 'user-001',
      submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'a',
        todayPlan: 'ab',
        challenges: 'abc',
      },
    };

    // Act: submitDailyReportを実行
    const result = submitDailyReport(input, mockTextAnalysisServiceAdapter);

    // Assert: 品質基準検証が合格となることを確認
    expect(result).toEqual({
      recordId: expect.any(String),
      reportId: 'report-001',
      submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
      isWithinDeadline: true,
      deadlineComparisonResult: {
        status: 'on_time',
        minutesBeforeDeadline: expect.any(Number),
      },
      recordedAt: expect.any(Date),
      validationResult: {
        isValid: true,
        errors: undefined,
      },
    });

    // 1文字のテキストが有効として扱われていることを確認
    expect(result.validationResult.isValid).toBe(true);
    expect(result.validationResult.errors).toBeUndefined();
  });
});