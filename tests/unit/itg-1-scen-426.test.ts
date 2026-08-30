import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';
import { type WeeklyAnalysisReportInput, type AggregatedWeeklyReportData, type ExtractedIssue, type WeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';

describe('Weekly Analysis Report Generation', () => {
  test('SCEN-426: Empty string and null issue items should be ignored during weekly analysis report generation', () => {
    // Setup: Define analysis period (Monday 2024-01-08 to Sunday 2024-01-14)
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    
    // Setup: Define team ID
    const teamId = 'team-001';
    
    // Setup: Define extracted issues with empty string, null, and valid content
    const extractedIssues: ExtractedIssue[] = [
      {
        issueId: 'issue-001',
        issueContent: '',
        reporterTeamId: teamId,
        occurrenceCount: 1
      },
      {
        issueId: 'issue-002',
        issueContent: null,
        reporterTeamId: teamId,
        occurrenceCount: 1
      },
      {
        issueId: 'issue-003',
        issueContent: '正常な課題内容',
        reporterTeamId: teamId,
        occurrenceCount: 2
      }
    ];
    
    // Setup: Build aggregated report data
    const aggregatedReportData: AggregatedWeeklyReportData = {
      reportRecords: [
        {
          reportId: 'report-001',
          reporterId: 'member-001',
          reportDate: '2024-01-08',
          reportContent: 'Yesterday: task1\nToday: task2\nIssue: ',
          submittedAt: '2024-01-08T08:00:00Z'
        },
        {
          reportId: 'report-002',
          reporterId: 'member-002',
          reportDate: 'report-002',
          reportContent: 'Yesterday: task3\nToday: task4\nIssue: null',
          submittedAt: '2024-01-09T08:00:00Z'
        },
        {
          reportId: 'report-003',
          reporterId: 'member-003',
          reportDate: '2024-01-10',
          reportContent: 'Yesterday: task5\nToday: task6\nIssue: 正常な課題内容',
          submittedAt: '2024-01-10T08:00:00Z'
        },
        {
          reportId: 'report-004',
          reporterId: 'member-004',
          reportDate: '2024-01-11',
          reportContent: 'Yesterday: task7\nToday: task8\nIssue: 正常な課題内容',
          submittedAt: '2024-01-11T08:00:00Z'
        },
        {
          reportId: 'report-005',
          reporterId: 'member-005',
          reportDate: '2024-01-12',
          reportContent: 'Yesterday: task9\nToday: task10\nIssue: 正常な課題内容',
          submittedAt: '2024-01-12T08:00:00Z'
        }
      ],
      extractedIssues: extractedIssues,
      dataQualityMetrics: {
        completenessRate: 0.95,
        deduplicationRate: 0.92,
        validityRate: 0.98
      }
    };
    
    // Setup: Define minimum report threshold
    const minimumReportThreshold = 5;
    
    // Setup: Build input object
    const input: WeeklyAnalysisReportInput = {
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      teamId: teamId,
      aggregatedReportData: aggregatedReportData,
      minimumReportThreshold: minimumReportThreshold
    };
    
    // Execute: Call generateWeeklyAnalysisReport
    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      input.analysisStartDate,
      input.analysisEndDate,
      input.teamId,
      input.aggregatedReportData,
      input.minimumReportThreshold
    );
    
    // Verify: Check that result is valid WeeklyAnalysisReport object
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    
    // Verify: Check aggregationPeriod
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(analysisStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(analysisEndDate);
    
    // Verify: Check generatedAt timestamp
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt instanceof Date).toBe(true);
    
    // Verify: Check issueRanking - only valid issue should be included
    expect(result.issueRanking).toBeDefined();
    expect(Array.isArray(result.issueRanking)).toBe(true);
    expect(result.issueRanking.length).toBe(1);
    
    // Verify: Empty string and null issues are excluded from ranking
    expect(result.issueRanking[0]).toBeDefined();
    expect(result.issueRanking[0].issueKeyword).toBe('正常な課題内容');
    expect(result.issueRanking[0].occurrenceFrequency).toBe(2);
    
    // Verify: priorityScores contains only valid issue entry
    expect(result.priorityScores).toBeDefined();
    expect(Array.isArray(result.priorityScores)).toBe(true);
    expect(result.priorityScores.length).toBe(1);
    
    // Verify: Priority score calculation - issue occurs 2 times out of 5 reports
    // frequencyScore = (2/5) * 100 = 40
    // impactScore = (3/5) * 100 = 60 (3 members reported this issue)
    // priorityScore = (40 * 0.6) + (60 * 0.4) = 24 + 24 = 48
    expect(result.priorityScores[0].keyword).toBe('正常な課題内容');
    expect(result.priorityScores[0].priorityScore).toBe(48);
    expect(result.priorityScores[0].priorityLevel).toBe('medium');
    
    // Verify: colorCodedIssueList contains only valid issue entry
    expect(result.colorCodedIssueList).toBeDefined();
    expect(Array.isArray(result.colorCodedIssueList)).toBe(true);
    expect(result.colorCodedIssueList.length).toBe(1);
    
    // Verify: Valid issue has correct color coding (yellow for medium priority)
    expect(result.colorCodedIssueList[0]).toBeDefined();
    expect(result.colorCodedIssueList[0].keyword).toBe('正常な課題内容');
    expect(result.colorCodedIssueList[0].displayColor).toBe('yellow');
    
    // Verify: recommendedActions is properly generated
    expect(result.recommendedActions).toBeDefined();
    expect(Array.isArray(result.recommendedActions)).toBe(true);
    
    // Verify: Empty and null issues have no impact on report
    const allKeywordsInRanking = result.issueRanking.map(item => item.issueKeyword);
    expect(allKeywordsInRanking).not.toContain('');
    expect(allKeywordsInRanking).not.toContain(null);
    
    const allKeywordsInPriority = result.priorityScores.map(item => item.keyword);
    expect(allKeywordsInPriority).not.toContain('');
    expect(allKeywordsInPriority).not.toContain(null);
    
    const allKeywordsInColorCoded = result.colorCodedIssueList.map(item => item.keyword);
    expect(allKeywordsInColorCoded).not.toContain('');
    expect(allKeywordsInColorCoded).not.toContain(null);
  });
});