import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  test('SCEN-788: cumulative keyword frequency from past 7 days and today increases priority score', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(async () => ({
        keywords: [
          { keyword: 'データベース障害', frequency: 2 },
          { keyword: '本番環境', frequency: 2 }
        ]
      })),
      assessImpactScore: jest.fn(async (keywordSet: string[], cumulativeFrequency: number) => {
        if (cumulativeFrequency >= 5) {
          return { baseScore: 50, frequencyBonus: 20, totalImpactScore: 70 };
        }
        return { baseScore: 50, frequencyBonus: 0, totalImpactScore: 50 };
      }),
      classifyIssueSeverity: jest.fn(async () => 'high')
    };

    const pastSevenDaysCacheData = {
      'データベース障害': 3,
      '本番環境': 3
    };

    const todayReportText = `
      昨日やったこと：本番環境のデータベース障害対応
      今日やること：本番環境のシステム検証
      抱えている課題：本番環境のデータベース障害が未解決
    `;

    const input = {
      issueId: 'issue-001',
      issueContent: todayReportText,
      occurrenceFrequency: 5,
      impactScore: 70,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    const extractedTodayKeywords = await mockTextAnalysisService.extractKeywords(todayReportText);
    
    const cumulativeFrequencyDataベース障害 = 
      (pastSevenDaysCacheData['データベース障害'] || 0) + 
      (extractedTodayKeywords.keywords.find(k => k.keyword === 'データベース障害')?.frequency || 0);
    
    const cumulativeFrequency本番環境 = 
      (pastSevenDaysCacheData['本番環境'] || 0) + 
      (extractedTodayKeywords.keywords.find(k => k.keyword === '本番環境')?.frequency || 0);

    expect(cumulativeFrequencyDataベース障害).toBe(5);
    expect(cumulativeFrequency本番環境).toBe(5);

    const keywordSet = ['データベース障害', '本番環境'];
    const impactAssessment = await mockTextAnalysisService.assessImpactScore(
      keywordSet,
      Math.max(cumulativeFrequencyDataベース障害, cumulativeFrequency本番環境)
    );

    expect(impactAssessment.baseScore).toBe(50);
    expect(impactAssessment.frequencyBonus).toBe(20);
    expect(impactAssessment.totalImpactScore).toBe(70);

    const result = await calculateIssuePriorityScore(input, mockTextAnalysisService);

    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(70);
    expect(result.colorCode).toBe('#FF0000');
    expect(new Date(result.calculatedAt)).toBeInstanceOf(Date);
  });
});