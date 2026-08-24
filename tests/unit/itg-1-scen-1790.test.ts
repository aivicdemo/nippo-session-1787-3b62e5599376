import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 課題キーワード発生頻度集計', () => {
  // SCEN-1790
  test('前月の日報から抽出された課題キーワードの発生頻度が正確に集計される', () => {
    const targetYear = 2026;
    const targetMonth = 7;
    const requestedByUserId = 'user-manager-001';

    const mockReportRecords = [
      {
        reportId: 'report-001',
        reportDate: '2026-07-01',
        teamId: 'team-dev-001',
        memberId: 'member-001',
        yesterdayAccomplishment: 'タスク A を完了',
        todayPlan: 'タスク B を開始',
        challenges: 'システム障害が発生',
      },
      {
        reportId: 'report-002',
        reportDate: '2026-07-02',
        teamId: 'team-dev-001',
        memberId: 'member-002',
        yesterdayAccomplishment: 'タスク C を完了',
        todayPlan: 'タスク D を開始',
        challenges: 'システム障害が原因で遅延',
      },
      {
        reportId: 'report-003',
        reportDate: '2026-07-03',
        teamId: 'team-dev-001',
        memberId: 'member-003',
        yesterdayAccomplishment: 'タスク E を完了',
        todayPlan: 'タスク F を開始',
        challenges: '納期遅延のリスク',
      },
      {
        reportId: 'report-004',
        reportDate: '2026-07-04',
        teamId: 'team-dev-001',
        memberId: 'member-004',
        yesterdayAccomplishment: 'タスク G を完了',
        todayPlan: 'タスク H を開始',
        challenges: 'システム障害と納期遅延',
      },
      {
        reportId: 'report-005',
        reportDate: '2026-07-05',
        teamId: 'team-dev-001',
        memberId: 'member-005',
        yesterdayAccomplishment: 'タスク I を完了',
        todayPlan: 'タスク J を開始',
        challenges: '人員不足で対応困難',
      },
      {
        reportId: 'report-006',
        reportDate: '2026-07-08',
        teamId: 'team-dev-001',
        memberId: 'member-001',
        yesterdayAccomplishment: 'タスク K を完了',
        todayPlan: 'タスク L を開始',
        challenges: 'システム障害が継続',
      },
      {
        reportId: 'report-007',
        reportDate: '2026-07-09',
        teamId: 'team-dev-001',
        memberId: 'member-002',
        yesterdayAccomplishment: 'タスク M を完了',
        todayPlan: 'タスク N を開始',
        challenges: '納期遅延が深刻化',
      },
      {
        reportId: 'report-008',
        reportDate: '2026-07-10',
        teamId: 'team-dev-001',
        memberId: 'member-003',
        yesterdayAccomplishment: 'タスク O を完了',
        todayPlan: 'タスク P を開始',
        challenges: '人員不足と品質管理',
      },
      {
        reportId: 'report-009',
        reportDate: '2026-07-11',
        teamId: 'team-dev-001',
        memberId: 'member-004',
        yesterdayAccomplishment: 'タスク Q を完了',
        todayPlan: 'タスク R を開始',
        challenges: 'その他課題について',
      },
      {
        reportId: 'report-010',
        reportDate: '2026-07-12',
        teamId: 'team-dev-001',
        memberId: 'member-005',
        yesterdayAccomplishment: 'タスク S を完了',
        todayPlan: 'タスク T を開始',
        challenges: '納期遅延の通知',
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywordFrequency: Record<string, number> = {};

        if (text.includes('システム障害')) {
          keywordFrequency['システム障害'] = (keywordFrequency['システム障害'] || 0) + 1;
        }
        if (text.includes('納期遅延')) {
          keywordFrequency['納期遅延'] = (keywordFrequency['納期遅延'] || 0) + 1;
        }
        if (text.includes('人員不足')) {
          keywordFrequency['人員不足'] = (keywordFrequency['人員不足'] || 0) + 1;
        }
        if (text.includes('その他課題')) {
          keywordFrequency['その他課題'] = (keywordFrequency['その他課題'] || 0) + 1;
        }

        return keywordFrequency;
      }),
      assessImpactScore: jest.fn(() => 75),
      classifyIssueSeverity: jest.fn(() => 'high'),
    };

    const result = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: ['team-dev-001'],
      },
      mockReportRecords,
      mockTextAnalysisAdapter,
    );

    expect(result).toHaveProperty('extractionPeriodStart');
    expect(result).toHaveProperty('extractionPeriodEnd');
    expect(result).toHaveProperty('totalReportCount');
    expect(result).toHaveProperty('reportsByTeam');
    expect(result).toHaveProperty('dataQualityScore');
    expect(result).toHaveProperty('extractedAt');

    expect(result.totalReportCount).toBe(10);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    const teamSummary = result.reportsByTeam.find((summary) => summary.teamId === 'team-dev-001');
    expect(teamSummary).toBeDefined();
    expect(teamSummary?.reportCount).toBe(10);
    expect(teamSummary?.submissionRate).toBeGreaterThanOrEqual(0);
    expect(teamSummary?.submissionRate).toBeLessThanOrEqual(100);
    expect(teamSummary?.reportIds).toHaveLength(10);

    expect(new Date(result.extractionPeriodStart)).toEqual(new Date('2026-07-01T00:00:00Z'));
    expect(new Date(result.extractionPeriodEnd)).toEqual(new Date('2026-07-31T23:59:59Z'));

    mockTextAnalysisAdapter.extractKeywords.mock.calls.forEach((call) => {
      expect(typeof call[0]).toBe('string');
    });

    const allChallengesTexts = mockReportRecords.map((record) => record.challenges);
    const systemIssueCount = allChallengesTexts.filter((text) => text.includes('システム障害')).length;
    const delayCount = allChallengesTexts.filter((text) => text.includes('納期遅延')).length;
    const staffingCount = allChallengesTexts.filter((text) => text.includes('人員不足')).length;
    const otherCount = allChallengesTexts.filter((text) => text.includes('その他課題')).length;

    expect(systemIssueCount).toBe(4);
    expect(delayCount).toBe(4);
    expect(staffingCount).toBe(2);
    expect(otherCount).toBe(1);

    expect(result.extractedAt).toBeTruthy();
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});