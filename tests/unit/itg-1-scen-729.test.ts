import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - Large-scale multi-team multi-day colorization', () => {
  let performanceMarkers: { start: number; end: number } | null = null;

  beforeEach(() => {
    performanceMarkers = null;
  });

  // SCEN-729: [edge] 課題優先度スコアによるダッシュボード強調表示機能 - 優先度スコアが最大規模（複数チーム×複数日分の数百件課題）でも正確に色分けされる
  test('SCEN-729: should accurately colorize 450 large-scale issues from multiple teams across 7 days within performance bounds', () => {
    // Setup: Generate 450 test issues across 3 teams, 7 days
    // Team 1 (150 issues): 5 with score 95, 5 with score 65, 5 with score 25, + 135 varied
    // Team 2 (150 issues): 5 with score 95, 5 with score 65, 5 with score 25, + 135 varied
    // Team 3 (150 issues): 5 with score 95, 5 with score 65, 5 with score 25, + 135 varied
    const teams = ['team-001', 'team-002', 'team-003'];
    const daysCount = 7;
    const issuesPerTeamPerDay = 21; // 3 teams * 7 days / 3 teams = 7 days * 3 issues = roughly 21 per team per day for distribution

    const allIssues: IssueSummary[] = [];
    let issueIdCounter = 1;

    // Generate 450 issues: distribute priority scores
    for (const teamId of teams) {
      // High priority: 5 issues with score 95
      for (let i = 0; i < 5; i++) {
        allIssues.push({
          issueId: `issue-${issueIdCounter++}`,
          priorityScore: 95,
          keyword: `critical-issue-team-${teamId}-${i}`,
          impactLevel: 'high',
        });
      }

      // Medium priority: 5 issues with score 65
      for (let i = 0; i < 5; i++) {
        allIssues.push({
          issueId: `issue-${issueIdCounter++}`,
          priorityScore: 65,
          keyword: `medium-issue-team-${teamId}-${i}`,
          impactLevel: 'medium',
        });
      }

      // Low priority: 5 issues with score 25
      for (let i = 0; i < 5; i++) {
        allIssues.push({
          issueId: `issue-${issueIdCounter++}`,
          priorityScore: 25,
          keyword: `low-issue-team-${teamId}-${i}`,
          impactLevel: 'low',
        });
      }

      // Varied priority scores to reach 150 per team (remaining 135)
      for (let i = 0; i < 135; i++) {
        const varyingScore = Math.floor(Math.random() * 100);
        allIssues.push({
          issueId: `issue-${issueIdCounter++}`,
          priorityScore: varyingScore,
          keyword: `varied-issue-team-${teamId}-${i}`,
          impactLevel: varyingScore > 70 ? 'high' : varyingScore > 40 ? 'medium' : 'low',
        });
      }
    }

    expect(allIssues.length).toBe(450);

    // Setup color threshold configuration
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 80,
      yellowThresholdMin: 50,
    };

    // Create input
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: allIssues,
      colorThresholds,
      requestedBy: 'dashboard-system-user',
    };

    // Execute: Measure performance
    performanceMarkers = { start: Date.now(), end: 0 };
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);
    performanceMarkers.end = Date.now();

    // Verify: Check colorized issues count matches input
    expect(result.colorizedIssues.length).toBe(450);

    // Verify: Validate color distribution
    expect(result.colorDistribution.red + result.colorDistribution.yellow + result.colorDistribution.green).toBe(450);

    // Verify: Spot-check specific score ranges for correctness
    // Sample high priority (score 95) issues: should be red (#FF0000)
    const highPriorityIssues = result.colorizedIssues.filter((issue) => issue.keyword.includes('critical-issue'));
    expect(highPriorityIssues.length).toBe(15); // 5 per team * 3 teams
    highPriorityIssues.forEach((issue) => {
      expect(issue.highlightColor).toBe('red');
    });

    // Sample medium priority (score 65) issues: should be yellow (#FFFF00)
    const mediumPriorityIssues = result.colorizedIssues.filter((issue) => issue.keyword.includes('medium-issue'));
    expect(mediumPriorityIssues.length).toBe(15); // 5 per team * 3 teams
    mediumPriorityIssues.forEach((issue) => {
      expect(issue.highlightColor).toBe('yellow');
    });

    // Sample low priority (score 25) issues: should be green (#00FF00)
    const lowPriorityIssues = result.colorizedIssues.filter((issue) => issue.keyword.includes('low-issue'));
    expect(lowPriorityIssues.length).toBe(15); // 5 per team * 3 teams
    lowPriorityIssues.forEach((issue) => {
      expect(issue.highlightColor).toBe('green');
    });

    // Verify: Validate color distribution counts
    // High priority issues (score >= 80): 15 critical + varied issues with score >= 80
    const redCount = result.colorizedIssues.filter((issue) => issue.highlightColor === 'red').length;
    const yellowCount = result.colorizedIssues.filter((issue) => issue.highlightColor === 'yellow').length;
    const greenCount = result.colorizedIssues.filter((issue) => issue.highlightColor === 'green').length;

    expect(redCount).toBe(result.colorDistribution.red);
    expect(yellowCount).toBe(result.colorDistribution.yellow);
    expect(greenCount).toBe(result.colorDistribution.green);

    // Verify: Ensure all 450 issues are distributed
    expect(redCount + yellowCount + greenCount).toBe(450);

    // Verify: Check processedAt timestamp is set and recent
    const processedAtTime = new Date(result.processedAt).getTime();
    expect(processedAtTime).toBeGreaterThan(0);
    expect(processedAtTime).toBeLessThanOrEqual(Date.now());

    // Performance check: Colorization of 450 issues should complete within 1000ms
    const processingDuration = performanceMarkers.end - performanceMarkers.start;
    expect(processingDuration).toBeLessThan(1000);

    // Verify: Validate threshold boundaries
    // All red issues should have score >= 80
    result.colorizedIssues
      .filter((issue) => issue.highlightColor === 'red')
      .forEach((issue) => {
        expect(issue.priorityScore).toBeGreaterThanOrEqual(colorThresholds.redThresholdMin);
      });

    // All yellow issues should have 50 <= score < 80
    result.colorizedIssues
      .filter((issue) => issue.highlightColor === 'yellow')
      .forEach((issue) => {
        expect(issue.priorityScore).toBeGreaterThanOrEqual(colorThresholds.yellowThresholdMin);
        expect(issue.priorityScore).toBeLessThan(colorThresholds.redThresholdMin);
      });

    // All green issues should have score < 50
    result.colorizedIssues
      .filter((issue) => issue.highlightColor === 'green')
      .forEach((issue) => {
        expect(issue.priorityScore).toBeLessThan(colorThresholds.yellowThresholdMin);
      });

    // Verify: No memory issues (basic check - all objects should be properly formed)
    result.colorizedIssues.forEach((issue) => {
      expect(issue.issueId).toBeDefined();
      expect(issue.shouldHighlight).toBeDefined();
      expect(['red', 'yellow', 'green', 'none']).toContain(issue.highlightColor);
    });
  });
});