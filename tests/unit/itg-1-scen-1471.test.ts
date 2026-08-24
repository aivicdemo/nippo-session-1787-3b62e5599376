import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type TextAnalysisServiceAdapter } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1471
  test('[edge] 前週日報データ集約・課題抽出機能 - 日報テキストの課題抽出において、出現頻度の計算結果が小数点以下を含む場合、丸め処理を行って整数で返す', () => {
    const mockTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        'システム障害': 2.5,
      }),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const reportTexts = [
      'システム障害が発生。システム障害への対応が必要。システム障害の原因調査中',
    ];

    const result = extractWeeklyReportData(
      weekStartDate,
      weekEndDate,
      reportTexts,
      mockTextAnalysisServiceAdapter
    );

    const systemFailureChallenge = result.extractedChallenges.find(
      (challenge) => challenge.keyword === 'システム障害'
    );

    expect(systemFailureChallenge).toBeDefined();
    expect(systemFailureChallenge?.occurrenceCount).toBe(3);
    expect(Number.isInteger(systemFailureChallenge?.occurrenceCount)).toBe(true);
  });
});