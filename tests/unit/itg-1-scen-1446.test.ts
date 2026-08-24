import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type TextAnalysisServiceAdapter } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis', () => {
  test('SCEN-1446: TextAnalysisServiceAdapter が正常応答したとき、抽出された課題キーワードが課題キーワード辞書に記録される', () => {
    const sourceReportText = 'システム連携に遅延が発生。データベース接続タイムアウト。対応が必要。';
    const reportId = 'report-001';
    const recordedAt = new Date('2024-01-15T10:30:00Z');

    const extractedKeywords = {
      'システム連携': 1,
      '遅延': 1,
      'データベース接続タイムアウト': 1,
    };

    const stubTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(extractedKeywords),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');

    const mockDailyReports = [
      {
        reportDate: new Date('2024-01-14T09:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-001'],
        challengeItems: [sourceReportText],
      },
    ];

    const result = await extractWeeklyReportData(
      {
        weekStartDate,
        weekEndDate,
        teamIds: ['team-001'],
        requestedByUserId: 'user-admin-001',
      },
      stubTextAnalysisAdapter,
      mockDailyReports,
    );

    expect(stubTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(sourceReportText);

    expect(result.extractedChallenges).toHaveLength(3);
    expect(result.extractedChallenges).toContainEqual(
      expect.objectContaining({
        keyword: 'システム連携',
        occurrenceCount: 1,
      }),
    );
    expect(result.extractedChallenges).toContainEqual(
      expect.objectContaining({
        keyword: '遅延',
        occurrenceCount: 1,
      }),
    );
    expect(result.extractedChallenges).toContainEqual(
      expect.objectContaining({
        keyword: 'データベース接続タイムアウト',
        occurrenceCount: 1,
      }),
    );

    result.extractedChallenges.forEach((challenge) => {
      expect(challenge.recordedAt).toBeDefined();
      expect(challenge.sourceReportId).toBeDefined();
    });
  });
});