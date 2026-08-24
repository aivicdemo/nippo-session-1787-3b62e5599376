import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('前週日報データ集約機能 - TextAnalysisServiceAdapter課題重要度分類失敗時の振る舞い', () => {
  // SCEN-1459
  test('TextAnalysisServiceAdapterの課題重要度分類機能が失敗した場合、エラーメッセージを含めてthrowする', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブ化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'システム障害', frequency: 2 },
          { keyword: '業務停止', frequency: 1 },
        ],
        confidence: 0.85,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockRejectedValue(new Error('API接続失敗')),
    };

    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');

    const request: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: ['team-001'],
      requestedByUserId: 'user-001',
    };

    const sampleDailyReports = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-a', 'user-b'],
        challengeItems: [
          'システム障害により業務が停止',
          'ネットワーク遅延が発生',
        ],
      },
      {
        reportDate: new Date('2024-01-09T09:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-c'],
        challengeItems: ['システム障害が継続中'],
      },
    ];

    // Act & Assert: エラーがthrowされることを検証
    await expect(async () => {
      await extractWeeklyReportData(request, mockTextAnalysisServiceAdapter);
    }).rejects.toThrow(/課題重要度分類API/);

    // Assert: classifyIssueSeverityが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    // Assert: エラーメッセージに「課題重要度分類APIの呼び出しに失敗しました」が含まれることを確認
    try {
      await extractWeeklyReportData(request, mockTextAnalysisServiceAdapter);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/課題重要度分類APIの呼び出しに失敗しました/);
      }
    }
  });
});