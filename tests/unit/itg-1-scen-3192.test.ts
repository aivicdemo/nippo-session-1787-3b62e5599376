import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type {
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
} from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: Monthly Report Generation to Analysis Completion Autonomous Execution', () => {
  // SCEN-3192: [error] Monthly report generation detects new issue category and escalates to human review
  test('should escalate to human review when new issue category is detected during analysis', async () => {
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'manager-001';

    const mockAiClient = {
      async extractKeywords(text: string) {
        // Known categories only: Bug, Specification Change, Performance
        const knownCategories = [
          { keyword: 'バグ対応', frequency: 5 },
          { keyword: '仕様変更', frequency: 3 },
          { keyword: 'パフォーマンス', frequency: 2 },
        ];
        return knownCategories;
      },

      async classifyIssueSeverity(text: string) {
        // During analysis, detect new category that wasn't in past 3 months
        // This simulates the detection during the analysis phase
        if (
          text.includes('セキュリティ脆弱性') ||
          text.includes('security vulnerability')
        ) {
          return {
            severity: 'high',
            category: 'セキュリティ脆弱性',
            isNewCategory: true,
            foundInPastThreeMonths: false,
          };
        }
        return {
          severity: 'medium',
          category: 'その他',
          isNewCategory: false,
          foundInPastThreeMonths: true,
        };
      },

      async assessImpactScore(keyword: string) {
        if (keyword === 'セキュリティ脆弱性') {
          return {
            score: 85,
            impactLevel: 'high',
            isNewPattern: true,
          };
        }
        return {
          score: 50,
          impactLevel: 'medium',
          isNewPattern: false,
        };
      },
    };

    const mockNotificationAdapter = {
      async sendReminderNotification(
        userId: string,
        _message: string
      ): Promise<{ status: string; deliveredAt?: Date }> {
        // Should NOT be called during escalation
        throw new Error('Notification should not be sent during escalation');
      },

      async scheduleNotification(
        _userId: string,
        _message: string,
        _scheduledTime: Date
      ): Promise<{ scheduled: boolean }> {
        // Should NOT be called during escalation
        throw new Error(
          'Notification scheduling should not occur during escalation'
        );
      },

      async getDeliveryStatus(_notificationId: string): Promise<{
        status: 'success' | 'failed' | 'pending';
      }> {
        return { status: 'pending' };
      },
    };

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(input, mockAiClient as any);

    // Verify escalation status
    expect(result.executionStatus).toBe('escalated');

    // Verify escalation reason
    expect(result).toHaveProperty('escalationReason');
    expect(result.escalationReason).toBe('NEW_ISSUE_CATEGORY_DETECTED');

    // Verify human review flag
    expect(result).toHaveProperty('awaitingHumanReview');
    expect(result.awaitingHumanReview).toBe(true);

    // Verify analysis data is present but not confirmed
    expect(result).toHaveProperty('analysisResultSummary');
    expect(result.analysisResultSummary).toBeDefined();

    // Verify audit log entry for escalation
    expect(result).toHaveProperty('auditLog');
    if (Array.isArray(result.auditLog)) {
      const escalationEntry = result.auditLog.find(
        (entry: any) =>
          entry.action === 'ESCALATION_TRIGGERED' ||
          entry.reason === 'NEW_ISSUE_CATEGORY_DETECTED'
      );
      expect(escalationEntry).toBeDefined();
      expect(escalationEntry.timestamp).toBeDefined();
    }

    // Verify no side effects were executed
    expect(result).toHaveProperty('sideEffectsApplied');
    if (Array.isArray(result.sideEffectsApplied)) {
      // Should be empty or contain only logging/audit actions
      const notificationSideEffects = result.sideEffectsApplied.filter(
        (effect: any) =>
          effect.type === 'NOTIFICATION_SENT' ||
          effect.type === 'ANALYSIS_RESULT_RECORDED'
      );
      expect(notificationSideEffects.length).toBe(0);
    }

    // Verify new category is identified in analysis data
    expect(result.analysisResultSummary).toBeDefined();
    if (result.analysisResultSummary && result.analysisResultSummary.topPriorityChallenges) {
      const newCategoryChallenge = result.analysisResultSummary.topPriorityChallenges.find(
        (challenge: any) => challenge.challengeId === 'セキュリティ脆弱性'
      );
      if (newCategoryChallenge) {
        expect(newCategoryChallenge).toHaveProperty('isNewCategory', true);
      }
    }

    // Verify manager notification did NOT occur
    expect(result.deliveryTimestamp).toBeUndefined();

    // Verify status is NOT 'success'
    expect(result.executionStatus).not.toBe('success');
  });
});