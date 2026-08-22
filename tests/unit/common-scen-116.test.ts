import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('Tx6Imp1Agent', () => {
  // SCEN-116: [error] 日報収集から分析レポート生成までの自動実行 AIエージェント - 「日報収集から分析レポート生成までの自動実行」が「経営判断が必要な課題が特定された場合」の場合に副作用の確定前に人へ引き継ぐ
  it('should escalate to human review when business judgment required issue is detected at Action 6', async () => {
    // Initialize test data: previous week daily reports from 10 members
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-07';
    const teamId = 'team-001';

    const input = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // Mock AI client that returns business judgment required signal at Action 6
    const mockAiClient: Tx6Imp1AiClient = {
      callAction01CollectDailyReports: jest.fn().mockResolvedValue({
        collected_report_count: 10,
        collection_status: 'completed',
        reports: [
          {
            member_id: 'member-001',
            report_date: '2024-01-07',
            content: 'Completed feature A, found performance issue',
            issues_extracted: ['performance_degradation'],
          },
          {
            member_id: 'member-002',
            report_date: '2024-01-07',
            content: 'Customer escalation: data loss incident',
            issues_extracted: ['data_loss_critical'],
          },
          {
            member_id: 'member-003',
            report_date: '2024-01-07',
            content: 'Completed routine maintenance',
            issues_extracted: [],
          },
          {
            member_id: 'member-004',
            report_date: '2024-01-07',
            content: 'Security vulnerability detected in API',
            issues_extracted: ['security_vulnerability'],
          },
          {
            member_id: 'member-005',
            report_date: '2024-01-07',
            content: 'Project delay due to resource constraint',
            issues_extracted: ['resource_shortage'],
          },
          {
            member_id: 'member-006',
            report_date: '2024-01-07',
            content: 'Completed testing phase',
            issues_extracted: [],
          },
          {
            member_id: 'member-007',
            report_date: '2024-01-07',
            content: 'Market competition analysis completed',
            issues_extracted: ['market_risk'],
          },
          {
            member_id: 'member-008',
            report_date: '2024-01-07',
            content: 'Budget overrun forecast for Q1',
            issues_extracted: ['budget_concern'],
          },
          {
            member_id: 'member-009',
            report_date: '2024-01-07',
            content: 'System outage 2 hours impact production',
            issues_extracted: ['system_outage'],
          },
          {
            member_id: 'member-010',
            report_date: '2024-01-07',
            content: 'Routine daily work completed',
            issues_extracted: [],
          },
        ],
      }),

      callAction02ClassifyAndExtractIssues: jest.fn().mockResolvedValue({
        extraction_status: 'completed',
        total_issues_extracted: 7,
        classified_issues: [
          {
            issue_keyword: 'performance_degradation',
            occurrence_count: 1,
            category: 'technical',
          },
          {
            issue_keyword: 'data_loss_critical',
            occurrence_count: 1,
            category: 'critical',
          },
          {
            issue_keyword: 'security_vulnerability',
            occurrence_count: 1,
            category: 'security',
          },
          {
            issue_keyword: 'resource_shortage',
            occurrence_count: 1,
            category: 'operational',
          },
          {
            issue_keyword: 'market_risk',
            occurrence_count: 1,
            category: 'strategic',
          },
          {
            issue_keyword: 'budget_concern',
            occurrence_count: 1,
            category: 'financial',
          },
          {
            issue_keyword: 'system_outage',
            occurrence_count: 1,
            category: 'critical',
          },
        ],
      }),

      callAction03AnalyzeTrends: jest.fn().mockResolvedValue({
        analysis_status: 'completed',
        trend_summary: {
          critical_issues_count: 2,
          security_issues_count: 1,
          operational_issues_count: 1,
          strategic_issues_count: 1,
          financial_issues_count: 1,
          technical_issues_count: 1,
          recurrence_detected: false,
          trend_direction: 'increasing',
        },
      }),

      callAction04ScoringAndPrioritization: jest.fn().mockResolvedValue({
        scoring_status: 'completed',
        prioritized_issues: [
          {
            issue_keyword: 'data_loss_critical',
            occurrence_count: 1,
            priority_score: 95,
            priority_rank: '高',
            business_impact: 'critical_data_integrity_risk',
          },
          {
            issue_keyword: 'system_outage',
            occurrence_count: 1,
            priority_score: 90,
            priority_rank: '高',
            business_impact: 'service_availability_2hour_loss',
          },
          {
            issue_keyword: 'security_vulnerability',
            occurrence_count: 1,
            priority_score: 85,
            priority_rank: '高',
            business_impact: 'potential_breach_risk',
          },
          {
            issue_keyword: 'budget_concern',
            occurrence_count: 1,
            priority_score: 75,
            priority_rank: '中',
            business_impact: 'q1_financial_impact',
          },
          {
            issue_keyword: 'market_risk',
            occurrence_count: 1,
            priority_score: 70,
            priority_rank: '中',
            business_impact: 'competitive_position_threat',
          },
        ],
      }),

      callAction05GenerateReport: jest.fn().mockResolvedValue({
        report_generation_status: 'completed',
        report_id: 'report-2024-01-08-001',
        total_issues_in_report: 5,
        critical_section_summary:
          '2件の重大課題（データ損失インシデント、システム障害2時間）が検出されました',
      }),

      callAction06ValidateAndEscalate: jest.fn().mockResolvedValue({
        validation_status: 'escalation_condition_triggered',
        escalation_condition_triggered: true,
        escalation_reason: 'business_judgment_required',
        business_judgment_required_issues: [
          {
            issue_keyword: 'data_loss_critical',
            priority_score: 95,
            priority_rank: '高',
            analysis_basis: 'customer_data_loss_impact_to_sla_compliance',
            management_decision_rationale:
              'SLA違反による顧客補償・契約見直しの経営判断が必要',
            recommended_action:
              '緊急対策チーム編成、顧客対応方針、補償額決定',
          },
          {
            issue_keyword: 'budget_concern',
            priority_score: 75,
            priority_rank: '中',
            analysis_basis: 'q1_forecast_exceeds_budget_by_15_percent',
            management_decision_rationale:
              'Q1予算超過15%、経営戦略変更が必要な可能性',
            recommended_action: '予算配分見直し、事業計画修正の検討',
          },
        ],
        audit_event_id: 'audit-escalation-2024-01-08-001',
        escalation_initiated_timestamp: new Date('2024-01-08T09:15:30Z'),
      }),

      callAction07DistributeReport: jest
        .fn()
        .mockRejectedValue(
          new Error('Should not be called due to escalation at Action 6')
        ),
    };

    // Execute agent with escalation condition
    const result = await runTx6Imp1Agent(input, mockAiClient);

    // Verify escalation status code
    expect(result.status_code).toBe('ESCALATION_PENDING_HUMAN_REVIEW');

    // Verify escalation reason
    expect(result.escalation_condition_triggered).toBe(true);
    expect(result.escalation_reason).toBe('business_judgment_required');

    // Verify escalation payload contains business judgment required issues
    expect(result.business_judgment_required_issues).toBeDefined();
    expect(result.business_judgment_required_issues).toHaveLength(2);

    const dataLossIssue = result.business_judgment_required_issues?.find(
      (i) => i.issue_keyword === 'data_loss_critical'
    );
    expect(dataLossIssue).toBeDefined();
    expect(dataLossIssue?.priority_score).toBe(95);
    expect(dataLossIssue?.priority_rank).toBe('高');
    expect(dataLossIssue?.analysis_basis).toContain(
      'customer_data_loss_impact_to_sla'
    );
    expect(dataLossIssue?.management_decision_rationale).toContain(
      'SLA違反'
    );
    expect(dataLossIssue?.recommended_action).toContain('緊急対策チーム');

    const budgetIssue = result.business_judgment_required_issues?.find(
      (i) => i.issue_keyword === 'budget_concern'
    );
    expect(budgetIssue).toBeDefined();
    expect(budgetIssue?.priority_score).toBe(75);
    expect(budgetIssue?.analysis_basis).toContain('q1_forecast_exceeds');

    // Verify Action 6 was called
    expect(mockAiClient.callAction06ValidateAndEscalate).toHaveBeenCalled();

    // Verify Action 7 was NOT called (side effect not committed)
    expect(mockAiClient.callAction07DistributeReport).not.toHaveBeenCalled();

    // Verify audit event is present
    expect(result.audit_event_id).toBe('audit-escalation-2024-01-08-001');
    expect(result.escalation_initiated_timestamp).toEqual(
      new Date('2024-01-08T09:15:30Z')
    );

    // Verify stakeholder notification queue entry is included
    expect(result.stakeholder_notification_queued).toBe(true);
    expect(result.notification_queue_entry_id).toBeDefined();

    // Verify Actions 1-5 were completed successfully before escalation
    expect(mockAiClient.callAction01CollectDailyReports).toHaveBeenCalledWith(
      expect.objectContaining({
        analysis_start_date: analysisStartDate,
        analysis_end_date: analysisEndDate,
        team_id: teamId,
      })
    );
    expect(mockAiClient.callAction02ClassifyAndExtractIssues).toHaveBeenCalled();
    expect(mockAiClient.callAction03AnalyzeTrends).toHaveBeenCalled();
    expect(mockAiClient.callAction04ScoringAndPrioritization).toHaveBeenCalled();
    expect(mockAiClient.callAction05GenerateReport).toHaveBeenCalled();

    // Verify report distribution did NOT occur (side effect rollback)
    expect(result.report_distributed).toBe(false);
    expect(result.report_distribution_rolled_back).toBe(true);

    // Verify returned payload structure
    expect(result).toMatchObject({
      status_code: 'ESCALATION_PENDING_HUMAN_REVIEW',
      escalation_condition_triggered: true,
      escalation_reason: 'business_judgment_required',
      report_id: 'report-2024-01-08-001',
      report_distributed: false,
      report_distribution_rolled_back: true,
      audit_event_id: 'audit-escalation-2024-01-08-001',
      stakeholder_notification_queued: true,
    });

    // Verify execution flow halted before Action 7
    expect(result.current_action_completed).toBe(6);
    expect(result.next_action_awaiting_human_decision).toBe(7);
  });
});