import { extractDashboardReportData, type DashboardReportDataOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード表示機能 - 複数報告の課題抽出', () => {
  // SCEN-2749
  test('報告が複数件の場合にすべての課題が返却される', async () => {
    const userId = 'manager-001';
    const teamId = 'team-engineering';
    const reportDate = '2024-01-15';

    const mockReports = [
      {
        reportId: 'report-001',
        reporterId: 'engineer-001',
        reporterName: 'Alice',
        content: 'システムが障害を起こし、本番環境で30分間ダウンタイムが発生した',
        submissionTimestamp: '2024-01-15T08:30:00Z',
        submissionStatus: 'submitted',
      },
      {
        reportId: 'report-002',
        reporterId: 'engineer-002',
        reporterName: 'Bob',
        content: '納期が2日間遅延するリスクが発生。クライアント対応が必要',
        submissionTimestamp: '2024-01-15T08:31:00Z',
        submissionStatus: 'submitted',
      },
      {
        reportId: 'report-003',
        reporterId: 'engineer-003',
        reporterName: 'Carol',
        content: 'チーム内で人員が不足しており、プロジェクト進行に支障が出ている',
        submissionTimestamp: '2024-01-15T08:32:00Z',
        submissionStatus: 'submitted',
      },
      {
        reportId: 'report-004',
        reporterId: 'engineer-004',
        reporterName: 'David',
        content: 'テスト工程で品質問題が複数件発見され、対応に時間を要している',
        submissionTimestamp: '2024-01-15T08:33:00Z',
        submissionStatus: 'submitted',
      },
      {
        reportId: 'report-005',
        reporterId: 'engineer-005',
        reporterName: 'Eve',
        content: '外注費が予算を大幅に超過する見込みが立っている',
        submissionTimestamp: '2024-01-15T08:34:00Z',
        submissionStatus: 'submitted',
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        const keywordMap: Record<string, Array<{ keyword: string; frequency: number }>> = {
          'システムが障害を起こし、本番環境で30分間ダウンタイムが発生した': [
            { keyword: 'システム障害', frequency: 1 },
          ],
          '納期が2日間遅延するリスクが発生。クライアント対応が必要': [
            { keyword: '納期遅延', frequency: 1 },
          ],
          'チーム内で人員が不足しており、プロジェクト進行に支障が出ている': [
            { keyword: '人員不足', frequency: 1 },
          ],
          'テスト工程で品質問題が複数件発見され、対応に時間を要している': [
            { keyword: '品質問題', frequency: 1 },
          ],
          '外注費が予算を大幅に超過する見込みが立っている': [
            { keyword: '予算超過', frequency: 1 },
          ],
        };
        return keywordMap[text] || [];
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        const scoreMap: Record<string, number> = {
          'システム障害': 95,
          '納期遅延': 75,
          '人員不足': 65,
          '品質問題': 80,
          '予算超過': 70,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        return 'high';
      }),
    };

    const mockReportDataStore = {
      getReportsByTeamAndDate: jest.fn(async () => mockReports),
    };

    const input = {
      userId,
      teamId,
      reportDate,
      includeUnsubmitted: true,
    };

    const result = await extractDashboardReportData(input, mockTextAnalysisAdapter, mockReportDataStore);

    expect(result).toBeDefined();
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.totalMembers).toBe(5);
    expect(result.submissionSummary.submittedCount).toBe(5);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(100);

    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues).toHaveLength(5);

    const issueKeywords = result.prioritizedIssues.map((issue) => {
      const contentMatch = issue.issueContent.match(
        /システム障害|納期遅延|人員不足|品質問題|予算超過/
      );
      return contentMatch ? contentMatch[0] : '';
    });

    expect(issueKeywords).toContain('システム障害');
    expect(issueKeywords).toContain('納期遅延');
    expect(issueKeywords).toContain('人員不足');
    expect(issueKeywords).toContain('品質問題');
    expect(issueKeywords).toContain('予算超過');

    const systemFailureIssue = result.prioritizedIssues.find(
      (issue) => issue.issueContent.includes('システム障害')
    );
    expect(systemFailureIssue).toBeDefined();
    expect(systemFailureIssue?.issueId).toBe('report-001');
    expect(systemFailureIssue?.priorityScore).toBe(95);
    expect(systemFailureIssue?.impactLevel).toBe('high');
    expect(systemFailureIssue?.reporterName).toBe('Alice');

    const delayIssue = result.prioritizedIssues.find(
      (issue) => issue.issueContent.includes('納期遅延')
    );
    expect(delayIssue).toBeDefined();
    expect(delayIssue?.issueId).toBe('report-002');
    expect(delayIssue?.priorityScore).toBe(75);
    expect(delayIssue?.reporterName).toBe('Bob');

    const staffingIssue = result.prioritizedIssues.find(
      (issue) => issue.issueContent.includes('人員不足')
    );
    expect(staffingIssue).toBeDefined();
    expect(staffingIssue?.issueId).toBe('report-003');
    expect(staffingIssue?.priorityScore).toBe(65);
    expect(staffingIssue?.reporterName).toBe('Carol');

    const qualityIssue = result.prioritizedIssues.find(
      (issue) => issue.issueContent.includes('品質問題')
    );
    expect(qualityIssue).toBeDefined();
    expect(qualityIssue?.issueId).toBe('report-004');
    expect(qualityIssue?.priorityScore).toBe(80);
    expect(qualityIssue?.reporterName).toBe('David');

    const budgetIssue = result.prioritizedIssues.find(
      (issue) => issue.issueContent.includes('予算超過')
    );
    expect(budgetIssue).toBeDefined();
    expect(budgetIssue?.issueId).toBe('report-005');
    expect(budgetIssue?.priorityScore).toBe(70);
    expect(budgetIssue?.reporterName).toBe('Eve');

    const priorityScores = result.prioritizedIssues.map((issue) => issue.priorityScore);
    const sortedScores = [...priorityScores].sort((a, b) => b - a);
    expect(priorityScores).toEqual(sortedScores);

    const colorMapping = result.prioritizedIssues.map((issue) => ({
      score: issue.priorityScore,
      color: issue.priorityColor,
    }));

    colorMapping.forEach(({ score, color }) => {
      if (score >= 80) {
        expect(color).toBe('red');
      } else if (score >= 60) {
        expect(color).toBe('yellow');
      } else {
        expect(color).toBe('green');
      }
    });

    expect(result.lastUpdatedAt).toBeDefined();
    expect(new Date(result.lastUpdatedAt).getTime()).toBeGreaterThan(0);
  });
});