import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1898: [edge] 検索対象期間内に月末日の日報が含まれる場合、該当日の課題が漏れなく抽出される
  test('月末日を含む検索期間で、月末日および期間内の全課題キーワードが漏れなく抽出・ランク付けされる', async () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-31T23:59:59Z');

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation((reportTexts: string[]) => {
        const keywordMap = new Map<string, number>();
        reportTexts.forEach((text) => {
          if (text.includes('データベース接続タイムアウト問題')) {
            keywordMap.set('データベース接続タイムアウト', (keywordMap.get('データベース接続タイムアウト') || 0) + 1);
          }
          if (text.includes('ログイン画面のバグ修正')) {
            keywordMap.set('ログイン画面', (keywordMap.get('ログイン画面') || 0) + 1);
          }
          if (text.includes('デプロイ環境設定')) {
            keywordMap.set('デプロイ環境設定', (keywordMap.get('デプロイ環境設定') || 0) + 1);
          }
        });
        return Array.from(keywordMap.entries()).map(([keyword, frequency]) => ({
          keyword,
          frequency,
        }));
      }),
      assessImpactScore: jest.fn().mockResolvedValue(50),
    };

    const mockReportRepository = {
      findByTeamIdAndDateRange: jest.fn().mockResolvedValue([
        {
          reportId: 'report_jan_15',
          teamId: 'team_001',
          reportDate: new Date('2026-01-15T09:00:00Z'),
          challenges: 'ログイン画面のバグ修正',
          createdAt: new Date('2026-01-15T09:00:00Z'),
        },
        {
          reportId: 'report_jan_31',
          teamId: 'team_001',
          reportDate: new Date('2026-01-31T09:00:00Z'),
          challenges: 'データベース接続タイムアウト問題、ログイン画面のバグ修正、デプロイ環境設定',
          createdAt: new Date('2026-01-31T09:00:00Z'),
        },
      ]),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team_001',
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user_001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockReportRepository
    );

    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThanOrEqual(3);

    const keywordNames = result.keywords.map((kw) => kw.keyword);
    expect(keywordNames).toContain('データベース接続タイムアウト');
    expect(keywordNames).toContain('ログイン画面');
    expect(keywordNames).toContain('デプロイ環境設定');

    const loginScreenKeyword = result.keywords.find((kw) => kw.keyword === 'ログイン画面');
    expect(loginScreenKeyword).toBeDefined();
    expect(loginScreenKeyword?.frequency).toBe(2);

    const databaseKeyword = result.keywords.find((kw) => kw.keyword === 'データベース接続タイムアウト');
    expect(databaseKeyword).toBeDefined();
    expect(databaseKeyword?.frequency).toBe(1);

    const deployKeyword = result.keywords.find((kw) => kw.keyword === 'デプロイ環境設定');
    expect(deployKeyword).toBeDefined();
    expect(deployKeyword?.frequency).toBe(1);

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(31);

    const sortedByFrequency = [...result.keywords].sort((a, b) => b.frequency - a.frequency);
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(sortedByFrequency[0].frequency);
  });
});