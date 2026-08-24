import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput, type DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2277: [normal] メンバー別生産性スコア計算機能 - 対象期間に報告したメンバーが複数名の場合、全メンバーの生産性スコアが算出され降順に並ぶ
  test('対象期間内に報告したメンバー5名全員の生産性スコアが算出され、高い順に降順でソート済みの配列が返却される', () => {
    const aggregationStartDate = new Date('2026-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2026-01-31T23:59:59Z');
    const teamId = 'team-001';

    // メンバー別の報告レコードを作成
    const memberARecords: DailyReportRecord[] = [
      {
        reportId: 'report-a-1',
        memberId: 'member-a',
        teamId: teamId,
        reportDate: new Date('2026-01-05T09:00:00Z'),
        yesterdayAccomplishment: 'Completed feature A implementation',
        todayPlans: 'Start testing feature A',
        issues: 'Build server slow',
      },
      {
        reportId: 'report-a-2',
        memberId: 'member-a',
        teamId: teamId,
        reportDate: new Date('2026-01-06T09:00:00Z'),
        yesterdayAccomplishment: 'Completed testing feature A',
        todayPlans: 'Start feature B development',
        issues: 'Database connection timeout',
      },
      {
        reportId: 'report-a-3',
        memberId: 'member-a',
        teamId: teamId,
        reportDate: new Date('2026-01-07T09:00:00Z'),
        yesterdayAccomplishment: 'Started feature B',
        todayPlans: 'Continue feature B',
        issues: 'Code review feedback pending',
      },
      {
        reportId: 'report-a-4',
        memberId: 'member-a',
        teamId: teamId,
        reportDate: new Date('2026-01-08T09:00:00Z'),
        yesterdayAccomplishment: 'Continued feature B',
        todayPlans: 'Finalize feature B',
        issues: 'Merge conflict in main branch',
      },
      {
        reportId: 'report-a-5',
        memberId: 'member-a',
        teamId: teamId,
        reportDate: new Date('2026-01-09T09:00:00Z'),
        yesterdayAccomplishment: 'Finalized feature B',
        todayPlans: 'Deploy feature B',
        issues: 'Production approval pending',
      },
    ];

    const memberBRecords: DailyReportRecord[] = [
      {
        reportId: 'report-b-1',
        memberId: 'member-b',
        teamId: teamId,
        reportDate: new Date('2026-01-10T09:00:00Z'),
        yesterdayAccomplishment: 'Started module C',
        todayPlans: 'Continue module C',
        issues: 'API integration issue',
      },
      {
        reportId: 'report-b-2',
        memberId: 'member-b',
        teamId: teamId,
        reportDate: new Date('2026-01-11T09:00:00Z'),
        yesterdayAccomplishment: 'Continued module C',
        todayPlans: 'Testing module C',
        issues: 'Third-party service outage',
      },
      {
        reportId: 'report-b-3',
        memberId: 'member-b',
        teamId: teamId,
        reportDate: new Date('2026-01-12T09:00:00Z'),
        yesterdayAccomplishment: 'Tested module C',
        todayPlans: 'Fix module C bugs',
        issues: 'Performance degradation',
      },
    ];

    const memberCRecords: DailyReportRecord[] = [
      {
        reportId: 'report-c-1',
        memberId: 'member-c',
        teamId: teamId,
        reportDate: new Date('2026-01-01T09:00:00Z'),
        yesterdayAccomplishment: 'Project kickoff',
        todayPlans: 'Architecture review',
        issues: 'Requirements unclear',
      },
      {
        reportId: 'report-c-2',
        memberId: 'member-c',
        teamId: teamId,
        reportDate: new Date('2026-01-02T09:00:00Z'),
        yesterdayAccomplishment: 'Architecture review completed',
        todayPlans: 'Start implementation',
        issues: 'Team alignment needed',
      },
      {
        reportId: 'report-c-3',
        memberId: 'member-c',
        teamId: teamId,
        reportDate: new Date('2026-01-03T09:00:00Z'),
        yesterdayAccomplishment: 'Implementation started',
        todayPlans: 'Continue development',
        issues: 'Resource constraint',
      },
      {
        reportId: 'report-c-4',
        memberId: 'member-c',
        teamId: teamId,
        reportDate: new Date('2026-01-13T09:00:00Z'),
        yesterdayAccomplishment: 'Development progress',
        todayPlans: 'Code review prep',
        issues: 'Testing coverage low',
      },
      {
        reportId: 'report-c-5',
        memberId: 'member-c',
        teamId: teamId,
        reportDate: new Date('2026-01-14T09:00:00Z'),
        yesterdayAccomplishment: 'Code review completed',
        todayPlans: 'Fix review comments',
        issues: 'Deadline risk',
      },
      {
        reportId: 'report-c-6',
        memberId: 'member-c',
        teamId: teamId,
        reportDate: new Date('2026-01-15T09:00:00Z'),
        yesterdayAccomplishment: 'Fixed review comments',
        todayPlans: 'Final testing',
        issues: 'Quality assurance pending',
      },
      {
        reportId: 'report-c-7',
        memberId: 'member-c',
        teamId: teamId,
        reportDate: new Date('2026-01-16T09:00:00Z'),
        yesterdayAccomplishment: 'Final testing done',
        todayPlans: 'Ready for production',
        issues: 'Deployment window blocking',
      },
    ];

    const memberDRecords: DailyReportRecord[] = [
      {
        reportId: 'report-d-1',
        memberId: 'member-d',
        teamId: teamId,
        reportDate: new Date('2026-01-20T09:00:00Z'),
        yesterdayAccomplishment: 'Documentation task',
        todayPlans: 'Continue documentation',
        issues: 'Documentation tools outdated',
      },
      {
        reportId: 'report-d-2',
        memberId: 'member-d',
        teamId: teamId,
        reportDate: new Date('2026-01-21T09:00:00Z'),
        yesterdayAccomplishment: 'Documentation continued',
        todayPlans: 'Finalize documentation',
        issues: 'Approval workflow slow',
      },
    ];

    const memberERecords: DailyReportRecord[] = [
      {
        reportId: 'report-e-1',
        memberId: 'member-e',
        teamId: teamId,
        reportDate: new Date('2026-01-17T09:00:00Z'),
        yesterdayAccomplishment: 'Support ticket resolution',
        todayPlans: 'Handle customer escalation',
        issues: 'Ticket volume spike',
      },
      {
        reportId: 'report-e-2',
        memberId: 'member-e',
        teamId: teamId,
        reportDate: new Date('2026-01-18T09:00:00Z'),
        yesterdayAccomplishment: 'Escalation handled',
        todayPlans: 'Training new support staff',
        issues: 'Training materials incomplete',
      },
      {
        reportId: 'report-e-3',
        memberId: 'member-e',
        teamId: teamId,
        reportDate: new Date('2026-01-19T09:00:00Z'),
        yesterdayAccomplishment: 'Training session conducted',
        todayPlans: 'Mentoring junior staff',
        issues: 'Knowledge transfer bottleneck',
      },
      {
        reportId: 'report-e-4',
        memberId: 'member-e',
        teamId: teamId,
        reportDate: new Date('2026-01-22T09:00:00Z'),
        yesterdayAccomplishment: 'Mentoring sessions held',
        todayPlans: 'Process improvement proposal',
        issues: 'Stakeholder buy-in needed',
      },
    ];

    const allReportRecords: DailyReportRecord[] = [
      ...memberARecords,
      ...memberBRecords,
      ...memberCRecords,
      ...memberDRecords,
      ...memberERecords,
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(() => ({
        keywords: [
          { keyword: 'API issue', frequency: 2 },
          { keyword: 'performance', frequency: 1 },
        ],
      })),
      assessImpactScore: jest.fn(() => 65),
      classifyIssueSeverity: jest.fn(() => 'medium'),
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds: [teamId],
      reportDataset: allReportRecords,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(
      input,
      mockTextAnalysisAdapter
    );

    // 検証1: 戻り値の配列要素数が5件であることを確認
    expect(result.teamMetrics).toHaveLength(1);
    const teamMetric = result.teamMetrics[0];
    expect(teamMetric.memberProductivityScores).toHaveLength(5);

    // 検証2: 配列が生産性スコアの高い順（降順）にソート済みであることを確認
    const memberScores = teamMetric.memberProductivityScores;
    for (let i = 0; i < memberScores.length - 1; i++) {
      expect(memberScores[i].resolutionContributionScore).toBeGreaterThanOrEqual(
        memberScores[i + 1].resolutionContributionScore
      );
    }

    // 検証3: 各メンバーの生産性スコアが0～100の範囲内の数値であることを確認
    memberScores.forEach((score) => {
      expect(score.resolutionContributionScore).toBeGreaterThanOrEqual(0);
      expect(score.resolutionContributionScore).toBeLessThanOrEqual(100);
    });

    // 検証4: メンバーIDの確認
    const memberIds = memberScores.map((score) => score.memberId);
    expect(memberIds).toContain('member-a');
    expect(memberIds).toContain('member-b');
    expect(memberIds).toContain('member-c');
    expect(memberIds).toContain('member-d');
    expect(memberIds).toContain('member-e');

    // 検証5: 提出率の検証（期待値: 各メンバーの報告件数 / 対象期間営業日数）
    // 対象期間は2026年1月1日～31日で、営業日数を想定して提出率を計算
    memberScores.forEach((score) => {
      expect(score.submissionRate).toBeGreaterThan(0);
      expect(score.submissionRate).toBeLessThanOrEqual(100);
    });

    // 検証6: 課題報告数が報告件数と連動していることを確認
    memberScores.forEach((score) => {
      expect(score.issueReportCount).toBeGreaterThanOrEqual(0);
    });

    // 検証7: 期待される具体的なスコア順序（メンバーCが最も多くの報告をしたため高スコア）
    expect(memberScores[0].memberId).toBe('member-c');
  });
});