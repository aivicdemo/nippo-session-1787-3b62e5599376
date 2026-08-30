import { prepareDashboardData } from '../../src/logic/dashboard-presentation';

describe('Dashboard Presentation Logic', () => {
  test('SCEN-614: prepareDashboardData returns aggregated dashboard data with calculated priority scores, impact degrees, and color codes sorted by priority', () => {
    // Prepare test report data
    const report1 = {
      report_id: 'report-1',
      engineer_name: 'Engineer A',
      yesterday_work: 'Fixed authentication module',
      today_plan: 'Deploy to staging',
      issues: 'Database connection error occurred during testing',
      submitted_at: new Date('2024-01-15T08:00:00Z'),
      priority_score: 0, // Will be calculated
      priority_level: '', // Will be calculated
      impact_degree: 0, // Will be calculated
      display_color: '', // Will be calculated
    };

    const report2 = {
      report_id: 'report-2',
      engineer_name: 'Engineer B',
      yesterday_work: 'Implemented API endpoints',
      today_plan: 'Write unit tests',
      issues: 'Database connection error and memory leak suspected',
      submitted_at: new Date('2024-01-15T08:15:00Z'),
      priority_score: 0,
      priority_level: '',
      impact_degree: 0,
      display_color: '',
    };

    const report3 = {
      report_id: 'report-3',
      engineer_name: 'Engineer C',
      yesterday_work: 'Refactored database queries',
      today_plan: 'Code review session',
      issues: 'Minor UI bug in dashboard',
      submitted_at: new Date('2024-01-15T08:30:00Z'),
      priority_score: 0,
      priority_level: '',
      impact_degree: 0,
      display_color: '',
    };

    const reportList = [report1, report2, report3];

    // Prepare issue frequency map for past 30 days
    // 'Database connection error' appears 5 times
    // 'Memory leak' appears 2 times
    // 'UI bug' appears 1 time
    const issueFrequencyMap = new Map<string, number>([
      ['Database connection error', 5],
      ['Memory leak', 2],
      ['UI bug', 1],
    ]);

    const teamSize = 10;
    const maxFrequency = 5; // Maximum frequency among all keywords

    // Calculate expected values for report1 (Database connection error)
    // frequency = 5
    // impactDegree = (5 / 10) * 100 = 50
    // priorityScore = (5 * 0.4) + (50 * 0.6) = 2 + 30 = 32
    // priorityLevel('low') because 32 < 40
    // displayColor('green') for 'low' priority

    const expectedPriorityScore1 = 32; // (5 * 0.4) + (50 * 0.6)
    const expectedImpactDegree1 = 50; // (5 / 10) * 100
    const expectedPriorityLevel1 = 'low';
    const expectedDisplayColor1 = 'green';

    // Calculate expected values for report2 (Database connection error and Memory leak)
    // Maximum frequency for this report is 5 (Database connection error)
    // impactDegree = (5 / 10) * 100 = 50
    // priorityScore = (5 * 0.4) + (50 * 0.6) = 32
    // priorityLevel = 'low'
    // displayColor = 'green'

    const expectedPriorityScore2 = 32;
    const expectedImpactDegree2 = 50;
    const expectedPriorityLevel2 = 'low';
    const expectedDisplayColor2 = 'green';

    // Calculate expected values for report3 (UI bug)
    // frequency = 1
    // impactDegree = (1 / 10) * 100 = 10
    // priorityScore = (1 * 0.4) + (10 * 0.6) = 0.4 + 6 = 6.4, rounded to 6
    // priorityLevel = 'low' because 6 < 40
    // displayColor = 'green'

    const expectedPriorityScore3 = 6; // (1 * 0.4) + (10 * 0.6)
    const expectedImpactDegree3 = 10; // (1 / 10) * 100
    const expectedPriorityLevel3 = 'low';
    const expectedDisplayColor3 = 'green';

    // Call the function under test
    const result = prepareDashboardData(
      reportList,
      issueFrequencyMap,
      teamSize
    );

    // Verify that result is an array
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);

    // Verify first report (should have highest or tied priority score)
    expect(result[0]).toHaveProperty('priority_score');
    expect(result[0]).toHaveProperty('priority_level');
    expect(result[0]).toHaveProperty('impact_degree');
    expect(result[0]).toHaveProperty('display_color');

    // Check specific calculated values for first report
    expect(result[0].priority_score).toBe(expectedPriorityScore1);
    expect(result[0].priority_level).toBe(expectedPriorityLevel1);
    expect(result[0].impact_degree).toBe(expectedImpactDegree1);
    expect(result[0].display_color).toBe(expectedDisplayColor1);

    // Verify all reports are sorted by priority score in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].priority_score).toBeGreaterThanOrEqual(
        result[i + 1].priority_score
      );
    }

    // Verify that color codes are properly assigned based on priority levels
    const lowPriorityReports = result.filter(
      (r) => r.priority_level === 'low'
    );
    lowPriorityReports.forEach((report) => {
      expect(report.display_color).toBe('green');
    });
  });
});