import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-043: extractAndRankIssues extracts and ranks issues from multiple daily reports with confidence filtering', async () => {
    // Test data: 5 daily reports with structured sections
    const dailyReports = [
      {
        memberId: 'member-001',
        date: '2024-01-15',
        yesterday: 'Completed API integration testing. Resolved 3 bugs in authentication module.',
        today: 'Start backend refactoring for performance improvement. Update database schema.',
        challenges: 'Database migration taking longer than expected. Team coordination needed for schema validation.',
      },
      {
        memberId: 'member-002',
        date: '2024-01-15',
        yesterday: 'Attended client meeting. Documented requirements for new feature.',
        today: 'Begin UI mockup design. Prepare presentation slides for stakeholders.',
        challenges: 'Client requirements still unclear. Need clarification on acceptance criteria.',
      },
      {
        memberId: 'member-003',
        date: '2024-01-15',
        yesterday: 'Implemented caching layer. Optimized query performance by 40%.',
        today: 'Deploy to staging environment. Monitor performance metrics.',
        challenges: 'Staging server has limited resources. Deployment script may fail under load.',
      },
      {
        memberId: 'member-004',
        date: '2024-01-15',
        yesterday: 'Reviewed team code. Provided feedback on pull requests.',
        today: 'Update documentation. Conduct 1-on-1 with junior developer.',
        challenges: 'Documentation is outdated. Junior developer needs additional mentoring on code patterns.',
      },
      {
        memberId: 'member-005',
        date: '2024-01-15',
        yesterday: 'Fixed critical production bug. Deployed hotfix to all regions.',
        today: 'Post-mortem analysis. Implement monitoring alerts to prevent recurrence.',
        challenges: 'Alert configuration complex. Need better monitoring infrastructure for edge cases.',
      },
    ];

    // Mock AI client stub that simulates Action 3 text analysis
    const mockAiClient = {
      invokeAction03: async (
        reportText: string,
      ): Promise<{
        issues: Array<{ text: string; confidence: number }>;
        risks: Array<{ text: string; confidence: number }>;
        achievements: Array<{ text: string; confidence: number }>;
      }> => {
        // Simulate LLM extraction with confidence scores
        const analysisMap: Record<
          string,
          {
            issues: Array<{ text: string; confidence: number }>;
            risks: Array<{ text: string; confidence: number }>;
            achievements: Array<{ text: string; confidence: number }>;
          }
        > = {
          'member-001': {
            issues: [
              { text: 'Database migration taking longer than expected', confidence: 0.92 },
              { text: 'Team coordination needed for schema validation', confidence: 0.85 },
            ],
            risks: [
              { text: 'Potential data inconsistency during migration', confidence: 0.78 },
              { text: 'Schema validation delays', confidence: 0.65 },
            ],
            achievements: [
              { text: 'API integration testing completed', confidence: 0.88 },
              { text: 'Resolved 3 bugs in authentication module', confidence: 0.91 },
            ],
          },
          'member-002': {
            issues: [
              { text: 'Client requirements still unclear', confidence: 0.89 },
              { text: 'Acceptance criteria not well defined', confidence: 0.82 },
            ],
            risks: [
              { text: 'Scope creep due to unclear requirements', confidence: 0.75 },
              { text: 'Communication gap with client', confidence: 0.68 },
            ],
            achievements: [
              { text: 'Attended client meeting', confidence: 0.86 },
              { text: 'Documented initial requirements', confidence: 0.79 },
            ],
          },
          'member-003': {
            issues: [
              { text: 'Staging server has limited resources', confidence: 0.87 },
              { text: 'Deployment script may fail under load', confidence: 0.84 },
            ],
            risks: [
              { text: 'Performance degradation in staging', confidence: 0.80 },
              { text: 'Production deployment risk', confidence: 0.73 },
            ],
            achievements: [
              { text: 'Implemented caching layer', confidence: 0.93 },
              { text: 'Optimized query performance by 40%', confidence: 0.90 },
            ],
          },
          'member-004': {
            issues: [
              { text: 'Documentation is outdated', confidence: 0.88 },
              { text: 'Junior developer needs mentoring on code patterns', confidence: 0.83 },
            ],
            risks: [
              { text: 'Knowledge gaps in junior team members', confidence: 0.76 },
              { text: 'Code quality inconsistency', confidence: 0.69 },
            ],
            achievements: [
              { text: 'Reviewed team code effectively', confidence: 0.85 },
              { text: 'Provided constructive feedback on PRs', confidence: 0.81 },
            ],
          },
          'member-005': {
            issues: [
              { text: 'Alert configuration complex', confidence: 0.90 },
              { text: 'Need better monitoring infrastructure for edge cases', confidence: 0.86 },
            ],
            risks: [
              { text: 'Similar production bugs could occur', confidence: 0.81 },
              { text: 'Incomplete monitoring coverage', confidence: 0.72 },
            ],
            achievements: [
              { text: 'Fixed critical production bug', confidence: 0.94 },
              { text: 'Deployed hotfix to all regions', confidence: 0.92 },
            ],
          },
        };

        // Return analysis results with confidence scores
        const memberKey = Object.keys(analysisMap)[
          Math.floor(Math.random() * Object.keys(analysisMap).length)
        ];
        return analysisMap[memberKey] || analysisMap['member-001'];
      },
    };

    // Execute extractAndRankIssues with mock AI client
    const extractionResult = await extractAndRankIssues(dailyReports, mockAiClient);

    // Verify extraction results structure
    expect(extractionResult).toBeDefined();
    expect(extractionResult).toHaveProperty('extractedIssues');
    expect(extractionResult).toHaveProperty('extractedRisks');
    expect(extractionResult).toHaveProperty('extractedAchievements');

    // Verify all 5 reports were processed
    expect(extractionResult.extractedIssues).toHaveLength(5);
    expect(extractionResult.extractedRisks).toHaveLength(5);
    expect(extractionResult.extractedAchievements).toHaveLength(5);

    // Verify confidence filtering: only items with confidence >= 0.7 are included
    extractionResult.extractedIssues.forEach((reportIssues) => {
      reportIssues.forEach((issue) => {
        expect(issue.confidence).toBeGreaterThanOrEqual(0.7);
      });
    });

    extractionResult.extractedRisks.forEach((reportRisks) => {
      reportRisks.forEach((risk) => {
        expect(risk.confidence).toBeGreaterThanOrEqual(0.7);
      });
    });

    extractionResult.extractedAchievements.forEach((reportAchievements) => {
      reportAchievements.forEach((achievement) => {
        expect(achievement.confidence).toBeGreaterThanOrEqual(0.7);
      });
    });

    // Verify semantic consistency: extracted items match original report sections
    const firstReportIssues = extractionResult.extractedIssues[0];
    expect(firstReportIssues.some((issue) => issue.text.includes('Database'))).toBe(true);
    expect(firstReportIssues.some((issue) => issue.text.includes('migration'))).toBe(true);

    const firstReportAchievements = extractionResult.extractedAchievements[0];
    expect(firstReportAchievements.some((ach) => ach.text.includes('API integration'))).toBe(true);
    expect(firstReportAchievements.some((ach) => ach.text.includes('bugs'))).toBe(true);

    // Verify all extracted items have required fields
    extractionResult.extractedIssues.forEach((reportIssues) => {
      reportIssues.forEach((issue) => {
        expect(issue).toHaveProperty('text');
        expect(issue).toHaveProperty('confidence');
        expect(typeof issue.text).toBe('string');
        expect(typeof issue.confidence).toBe('number');
        expect(issue.text.length).toBeGreaterThan(0);
      });
    });

    // Verify results can be passed to subsequent ranking actions
    expect(extractionResult.extractedIssues).toBeTruthy();
    expect(Array.isArray(extractionResult.extractedIssues)).toBe(true);
    expect(extractionResult.extractedIssues[0]).toBeDefined();
    expect(Array.isArray(extractionResult.extractedIssues[0])).toBe(true);

    // Verify ACTION_03_PROMPT_VERSION is available
    const { ACTION_03_PROMPT_VERSION, buildAction03Prompt } = await import(
      '../../src/agents/tx-2-imp-1/prompts/action-03'
    );
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');
    expect(buildAction03Prompt).toBeDefined();
    expect(typeof buildAction03Prompt).toBe('function');

    // Verify buildAction03Prompt generates proper prompt structure
    const testPrompt = buildAction03Prompt('Test report text');
    expect(testPrompt).toBeDefined();
    expect(typeof testPrompt).toBe('string');
    expect(testPrompt.length).toBeGreaterThan(0);
  });
});