import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - extractWeeklyReportData', () => {
  // SCEN-1438: [normal] 前週日報データ集約機能 - 前週7日間の日報が複数件（全チームメンバー10名分）のとき、すべての日報から課題項目が抽出される

  test('should extract and aggregate challenge keywords from 70 daily reports (10 members x 7 days) with occurrence frequency, impact scores, and severity classification', () => {
    // ==================== Setup: Test Data ====================
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');

    const memberIds = [
      'member-001', 'member-002', 'member-003', 'member-004', 'member-005',
      'member-006', 'member-007', 'member-008', 'member-009', 'member-010'
    ];

    const teamIds = ['team-alpha'];

    // Generate 70 daily reports (10 members × 7 days)
    // Each day has unique challenges to simulate realistic scenario
    const dailyReports = [];
    let reportIndex = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const reportDate = new Date(weekStartDate);
      reportDate.setDate(reportDate.getDate() + dayOffset);

      for (let memberIdx = 0; memberIdx < 10; memberIdx++) {
        reportIndex++;
        
        // Distribute different challenges across reports
        // Some challenges appear multiple times (high frequency)
        // Some appear once (low frequency)
        let challengeItems: string[] = [];

        if (dayOffset < 3) {
          // Days 0-2: Network delay, Document gaps, Dependency delays
          challengeItems = [
            'ネットワーク遅延',
            'ドキュメント未整備',
            'API仕様の曖昧性'
          ];
        } else if (dayOffset < 5) {
          // Days 3-4: Database issues, Testing gaps, Schedule conflicts
          challengeItems = [
            'ネットワーク遅延',
            'データベースロック',
            'テスト不足',
            'スケジュール調整が必要'
          ];
        } else {
          // Days 5-6: Performance, Resource allocation, Review delays
          challengeItems = [
            'パフォーマンス問題',
            'リソース不足',
            'コードレビュー待ち',
            'ネットワーク遅延'
          ];
        }

        dailyReports.push({
          reportId: `report-${reportIndex}`,
          reportDate,
          memberId: memberIds[memberIdx],
          teamId: teamIds[0],
          yesterdayAccomplishment: `Completed task set for day ${dayOffset}`,
          todayPlan: `Planned tasks for day ${dayOffset + 1}`,
          challengeItems
        });
      }
    }

    // ==================== Setup: Mock TextAnalysisServiceAdapter ====================
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((challengeText: string) => {
        // Parse challenge items and return keyword frequency data
        const keywords = new Map<string, number>();
        
        // Simulate extraction logic
        if (challengeText.includes('ネットワーク遅延')) {
          keywords.set('ネットワーク遅延', 1);
        }
        if (challengeText.includes('ドキュメント未整備')) {
          keywords.set('ドキュメント未整備', 1);
        }
        if (challengeText.includes('API仕様の曖昧性')) {
          keywords.set('API仕様の曖昧性', 1);
        }
        if (challengeText.includes('データベースロック')) {
          keywords.set('データベースロック', 1);
        }
        if (challengeText.includes('テスト不足')) {
          keywords.set('テスト不足', 1);
        }
        if (challengeText.includes('スケジュール調整が必要')) {
          keywords.set('スケジュール調整が必要', 1);
        }
        if (challengeText.includes('パフォーマンス問題')) {
          keywords.set('パフォーマンス問題', 1);
        }
        if (challengeText.includes('リソース不足')) {
          keywords.set('リソース不足', 1);
        }
        if (challengeText.includes('コードレビュー待ち')) {
          keywords.set('コードレビュー待ち', 1);
        }

        return Array.from(keywords.entries()).map(([keyword, count]) => ({
          keyword,
          frequency: count
        }));
      }),

      assessImpactScore: jest.fn((keyword: string) => {
        // Assign team-wide impact scores (0-100)
        const impactScores: { [key: string]: number } = {
          'ネットワーク遅延': 75,
          'ドキュメント未整備': 65,
          'API仕様の曖昧性': 80,
          'データベースロック': 85,
          'テスト不足': 70,
          'スケジュール調整が必要': 60,
          'パフォーマンス問題': 90,
          'リソース不足': 55,
          'コードレビュー待ち': 50
        };
        return impactScores[keyword] || 50;
      }),

      classifyIssueSeverity: jest.fn((keyword: string): 'high' | 'medium' | 'low' => {
        // Classify severity based on keyword
        const severityMap: { [key: string]: 'high' | 'medium' | 'low' } = {
          'ネットワーク遅延': 'high',
          'ドキュメント未整備': 'medium',
          'API仕様の曖昧性': 'high',
          'データベースロック': 'high',
          'テスト不足': 'medium',
          'スケジュール調整が必要': 'medium',
          'パフォーマンス問題': 'high',
          'リソース不足': 'medium',
          'コードレビュー待ち': 'low'
        };
        return severityMap[keyword] || 'medium';
      })
    };

    // ==================== Execute Function ====================
    const result = extractWeeklyReportData(
      {
        weekStartDate,
        weekEndDate,
        teamIds,
        requestedByUserId: 'admin-001'
      },
      mockTextAnalysisAdapter,
      dailyReports
    );

    // ==================== Assertions ====================

    // (1) Verify aggregation includes all 70 reports
    expect(result.totalReportsExtracted).toBe(70);

    // (2) Verify week range is correctly set
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // (3) Verify daily report summaries (7 days)
    expect(result.reportsByDate).toHaveLength(7);

    // Verify each day has 10 reports
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      expect(result.reportsByDate[dayIdx].reportCount).toBe(10);
      expect(result.reportsByDate[dayIdx].submittedByUserIds).toHaveLength(10);
      expect(result.reportsByDate[dayIdx].submittedByUserIds).toEqual(
        expect.arrayContaining(memberIds)
      );
    }

    // (4) Verify extracted challenges from aggregation
    // Expected unique keywords from test data:
    // Days 0-2: ネットワーク遅延, ドキュメント未整備, API仕様の曖昧性
    // Days 3-4: ネットワーク遅延, データベースロック, テスト不足, スケジュール調整が必要
    // Days 5-6: パフォーマンス問題, リソース不足, コードレビュー待ち, ネットワーク遅延
    // Total unique keywords: 9
    expect(result.extractedChallenges).toHaveLength(9);

    // (5) Verify each challenge has required fields
    for (const challenge of result.extractedChallenges) {
      expect(challenge).toHaveProperty('keyword');
      expect(challenge).toHaveProperty('occurrenceCount');
      expect(challenge).toHaveProperty('impactScore');
      expect(challenge).toHaveProperty('severity');

      // Type validation
      expect(typeof challenge.keyword).toBe('string');
      expect(typeof challenge.occurrenceCount).toBe('number');
      expect(typeof challenge.impactScore).toBe('number');
      expect(['high', 'medium', 'low']).toContain(challenge.severity);

      // Value range validation
      expect(challenge.occurrenceCount).toBeGreaterThan(0);
      expect(challenge.impactScore).toBeGreaterThanOrEqual(0);
      expect(challenge.impactScore).toBeLessThanOrEqual(100);
    }

    // (6) Verify occurrence frequency is correctly calculated
    // ネットワーク遅延: appears in days 0-6, all 10 members = 70 occurrences
    const networkDelayChallenge = result.extractedChallenges.find(
      c => c.keyword === 'ネットワーク遅延'
    );
    expect(networkDelayChallenge).toBeDefined();
    expect(networkDelayChallenge!.occurrenceCount).toBe(70);

    // ドキュメント未整備: appears in days 0-2, all 10 members = 30 occurrences
    const documentGapsChallenge = result.extractedChallenges.find(
      c => c.keyword === 'ドキュメント未整備'
    );
    expect(documentGapsChallenge).toBeDefined();
    expect(documentGapsChallenge!.occurrenceCount).toBe(30);

    // パフォーマンス問題: appears in days 5-6, all 10 members = 20 occurrences
    const performanceChallenge = result.extractedChallenges.find(
      c => c.keyword === 'パフォーマンス問題'
    );
    expect(performanceChallenge).toBeDefined();
    expect(performanceChallenge!.occurrenceCount).toBe(20);

    // (7) Verify impact scores are assigned correctly
    expect(networkDelayChallenge!.impactScore).toBe(75);
    expect(documentGapsChallenge!.impactScore).toBe(65);
    expect(performanceChallenge!.impactScore).toBe(90);

    // (8) Verify severity classification
    expect(networkDelayChallenge!.severity).toBe('high');
    expect(documentGapsChallenge!.severity).toBe('medium');
    expect(performanceChallenge!.severity).toBe('high');

    // (9) Verify data quality score calculation
    // Quality score is based on completeness: (70 / 70) * 100 = 100
    expect(result.dataQualityScore).toBe(100);

    // (10) Verify no duplicates or missing data
    const extractedKeywords = result.extractedChallenges.map(c => c.keyword);
    const uniqueKeywords = new Set(extractedKeywords);
    expect(extractedKeywords).toHaveLength(uniqueKeywords.size);

    // (11) Verify challenges are sorted by impact score (descending)
    for (let i = 0; i < result.extractedChallenges.length - 1; i++) {
      expect(result.extractedChallenges[i].impactScore).toBeGreaterThanOrEqual(
        result.extractedChallenges[i + 1].impactScore
      );
    }

    // (12) Verify data coverage: all 70 reports accounted for
    const totalReportsCovered = result.reportsByDate.reduce(
      (sum, dailySummary) => sum + dailySummary.reportCount,
      0
    );
    expect(totalReportsCovered).toBe(70);

    // (13) Verify mockAdapter was called appropriately
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});