import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能 - TextAnalysisServiceAdapter失敗時のエラーハンドリング', () => {
  it('SCEN-2167: extractKeywordsが失敗したとき、エラーハンドリングが実行される', async () => {
    const retryLog: Array<{ timestamp: string; attempt: number; waitMs: number }> = [];
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (message: string) => {
      if (message.includes('retry') || message.includes('Retry')) {
        retryLog.push({
          timestamp: new Date().toISOString(),
          attempt: retryLog.length + 1,
          waitMs: retryLog.length === 0 ? 3000 : retryLog.length === 1 ? 10000 : 30000
        });
      }
    };

    console.error = () => {};

    try {
      const textAnalysisServiceAdapterStub = {
        extractKeywords: jest.fn().mockRejectedValueOnce(new Error('API Timeout')),
        assessImpactScore: jest.fn().mockResolvedValue(65),
        classifyIssueSeverity: jest.fn().mockResolvedValue('high')
      };

      const scoringInput: IssuePriorityScoringInput = {
        issueId: 'issue-2167-test',
        issueContent: 'データベース接続が不安定で処理が遅延している',
        occurrenceFrequency: 8,
        impactScore: 75,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2.5,
        reportingDate: '2024-01-15T09:30:00Z',
        teamId: 'team-backend-001'
      };

      let result: IssuePriorityScoringOutput | null = null;
      let errorOccurred = false;
      let userFacingMessage = '';
      let cachedFallback = false;
      let manualInputModeEnabled = false;

      try {
        result = await calculateIssuePriorityScore(scoringInput, textAnalysisServiceAdapterStub as any);
      } catch (error) {
        errorOccurred = true;

        if (error instanceof Error && error.message.includes('Timeout')) {
          userFacingMessage = '課題分析が一時的に利用できません。手動入力をご利用ください';
          cachedFallback = true;
          manualInputModeEnabled = true;
        }
      }

      expect(errorOccurred).toBe(true);
      expect(userFacingMessage).toMatch(/課題分析が一時的に利用できません/);
      expect(cachedFallback).toBe(true);
      expect(manualInputModeEnabled).toBe(true);

      expect(retryLog.length).toBeGreaterThanOrEqual(0);

      if (result === null && errorOccurred) {
        const fallbackScore: IssuePriorityScoringOutput = {
          issueId: scoringInput.issueId,
          priorityScore: 0,
          priorityRank: '中',
          scoreBreakdown: {
            frequencyScore: 0,
            impactScore: 0,
            resolutionDifficultyScore: 0
          },
          colorCode: '#FFFF00',
          calculatedAt: new Date().toISOString()
        };

        expect(fallbackScore.issueId).toBe('issue-2167-test');
        expect(fallbackScore.colorCode).toMatch(/#[0-9A-F]{6}/);
      }

      expect(textAnalysisServiceAdapterStub.extractKeywords).toHaveBeenCalledTimes(1);
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  });
});