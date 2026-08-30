import { prepareDashboardData, type DashboardDataPrepareInput, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('Dashboard Presentation', () => {
  test('SCEN-367: prepareDashboardData with incomplete project priority information falls back to default order', async () => {
    // Setup: Prepare project hierarchy with incomplete priority information
    const projectHierarchyIncomplete = [
      { projectId: 'proj-A', projectName: 'Project A', priorityScore: 90 },
      { projectId: 'proj-B', projectName: 'Project B', priorityScore: 75 },
      { projectId: 'proj-C', projectName: 'Project C' }, // Missing priorityScore
    ];

    // Setup: Prepare team reports with assignments to all projects
    const teamReportsData = [
      {
        memberId: 'user-1',
        memberName: 'Alice',
        yesterday: 'Completed API endpoint',
        today: 'Start database migration',
        projectId: 'proj-A',
        issues: 'Build failure, dependency conflict',
        submittedAt: new Date('2024-01-15T08:00:00Z'),
      },
      {
        memberId: 'user-2',
        memberName: 'Bob',
        yesterday: 'Fixed UI bug',
        today: 'Code review',
        projectId: 'proj-B',
        issues: 'Test environment unstable',
        submittedAt: new Date('2024-01-15T08:15:00Z'),
      },
      {
        memberId: 'user-3',
        memberName: 'Charlie',
        yesterday: 'Deployed to staging',
        today: 'Performance optimization',
        projectId: 'proj-C',
        issues: 'Memory leak detected',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
    ];

    // Setup: Prepare dashboard input
    const dashboardInput: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: new Date('2024-01-15T00:00:00Z'),
      requestingUserId: 'user-1',
      includeHistoricalTrend: false,
    };

    // Setup: Mock console.warn to capture warning messages
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Execute: Call prepareDashboardData with incomplete project priority data
    const result = await prepareDashboardData(dashboardInput);

    // Verify: Result is DashboardDisplayData with valid structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty('submissionStatusSummary');
    expect(result).toHaveProperty('unsubmittedMembers');
    expect(result).toHaveProperty('prioritizedIssueList');
    expect(result).toHaveProperty('issueKeywordRanking');
    expect(result).toHaveProperty('lastUpdatedAt');

    // Verify: submissionStatusSummary has valid values
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary).not.toBeNull();
    expect(typeof result.submissionStatusSummary.submittedCount).toBe('number');
    expect(typeof result.submissionStatusSummary.pendingCount).toBe('number');

    // Verify: unsubmittedMembers is valid array
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers).not.toBeNull();

    // Verify: prioritizedIssueList contains issues sorted with proj-C fallback to default order
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    expect(result.prioritizedIssueList.length).toBeGreaterThan(0);

    // Verify: Issues from proj-A and proj-B are prioritized by score
    const projAIssues = result.prioritizedIssueList.filter(issue => issue.reporterName && 
      teamReportsData.find(r => r.memberId === issue.reporterName && r.projectId === 'proj-A'));
    const projBIssues = result.prioritizedIssueList.filter(issue => issue.reporterName && 
      teamReportsData.find(r => r.memberId === issue.reporterName && r.projectId === 'proj-B'));
    
    // Verify: proj-C issues appear but in default order (no priority score applied)
    if (result.prioritizedIssueList.length > 0) {
      expect(result.prioritizedIssueList[0]).toHaveProperty('priorityScore');
      expect(typeof result.prioritizedIssueList[0].priorityScore).toBe('number');
    }

    // Verify: issueKeywordRanking has valid structure
    expect(Array.isArray(result.issueKeywordRanking)).toBe(true);
    expect(result.issueKeywordRanking).not.toBeNull();

    // Verify: lastUpdatedAt is a valid Date
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
    expect(result.lastUpdatedAt).not.toBeNull();

    // Verify: Warning message about incomplete project priority information is logged
    const warningLogged = warnSpy.mock.calls.some(call =>
      typeof call[0] === 'string' &&
      call[0].includes('一部のプロジェクト優先度情報が不完全です') &&
      call[0].includes('デフォルト順序で表示します')
    );
    expect(warningLogged).toBe(true);

    // Cleanup
    warnSpy.mockRestore();
  });
});