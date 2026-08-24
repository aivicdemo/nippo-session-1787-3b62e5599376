import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 月次レポートデータ抽出', () => {
  // SCEN-2349: [normal] 指定期間内に1件の日報がある場合、その日報から抽出された課題を集計に含める
  it('should extract and aggregate issues from a single daily report within the specified period', async () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-a';
    
    const reportDate = new Date('2024-01-15T09:00:00Z');
    const reportContent = {
      yesterdayAccomplishments: 'バグ修正',
      todayPlans: 'テスト実施',
      currentIssues: 'ネットワーク接続の遅延問題'
    };
    
    const mockTextAnalysisAdapter = {
      extractKeywords: async (text: string) => {
        return {
          keywords: ['ネットワーク接続', '遅延', '接続'],
          frequency: [1, 1, 1]
        };
      },
      assessImpactScore: async (keyword: string) => {
        return 65;
      },
      classifyIssueSeverity: async (text: string) => {
        if (text.includes('ネットワーク接続の遅延問題')) {
          return 'medium';
        }
        return 'low';
      }
    };
    
    const mockReportRecords = [
      {
        reportId: 'report-001',
        userId: 'user-a',
        teamId: 'team-001',
        reportDate: reportDate,
        yesterdayAccomplishments: reportContent.yesterdayAccomplishments,
        todayPlans: reportContent.todayPlans,
        currentIssues: reportContent.currentIssues,
        submittedAt: new Date('2024-01-15T08:30:00Z')
      }
    ];
    
    const result = await extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: undefined
      },
      mockTextAnalysisAdapter,
      mockReportRecords
    );
    
    expect(result.totalReportCount).toBe(1);
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');
    expect(result.reportsByTeam).toBeDefined();
    expect(result.reportsByTeam.length).toBeGreaterThan(0);
    
    const teamSummary = result.reportsByTeam.find(t => t.teamId === 'team-001');
    expect(teamSummary).toBeDefined();
    expect(teamSummary?.reportCount).toBe(1);
    expect(teamSummary?.reportIds).toContain('report-001');
    
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBeDefined();
  });
});