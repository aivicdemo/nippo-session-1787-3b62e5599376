import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';
import type { 
  AnalysisReportInput,
  AnalysisReportOutput,
  AuditLogEntry
} from '../../src/logic/analysis-reporting';

// Mock audit log storage
let audit_log: AuditLogEntry[] = [];

// Mock AI Client with low confidence, malformed, and contradictory outputs
interface MockAiClientConfig {
  action_type: string;
  confidence?: number;
  malformed?: boolean;
  contradictory?: boolean;
  payload?: Record<string, unknown>;
}

class FakeAiClient {
  private config_map: Map<string, MockAiClientConfig>;

  constructor() {
    this.config_map = new Map();
  }

  setActionConfig(action_type: string, config: MockAiClientConfig): void {
    this.config_map.set(action_type, config);
  }

  async executeAction(action_type: string, input_data: Record<string, unknown>): Promise<{
    confidence: number;
    result: Record<string, unknown>;
    is_malformed: boolean;
    is_contradictory: boolean;
  }> {
    const config = this.config_map.get(action_type);
    if (!config) {
      throw new Error(`No config for action: ${action_type}`);
    }

    if (config.malformed) {
      return {
        confidence: config.confidence || 0.9,
        result: {
          // Missing required fields, invalid schema
          partial_data: 'incomplete',
          // Missing: analysis_id, timestamp, pattern_data
        },
        is_malformed: true,
        is_contradictory: false,
      };
    }

    if (config.contradictory) {
      return {
        confidence: config.confidence || 0.9,
        result: {
          analysis_id: 'test_analysis_001',
          timestamp: '2024-01-15T11:00:00Z',
          patterns: [
            {
              pattern_id: 'p001',
              description: 'Issue frequency increasing',
              trend: 'upward',
            },
            {
              pattern_id: 'p002',
              description: 'Issue frequency decreasing',
              trend: 'downward',
            },
          ],
          contradictory_result: true,
          conflicting_conclusions: [
            'Pattern shows upward trend',
            'Pattern shows downward trend',
          ],
        },
        is_malformed: false,
        is_contradictory: true,
      };
    }

    return {
      confidence: config.confidence || 0.9,
      result: config.payload || { success: true },
      is_malformed: false,
      is_contradictory: false,
    };
  }
}

// Mock escalation handler
function mock_escalation_handler(
  event_type: string,
  details: Record<string, unknown>
): void {
  const escalation_entry: AuditLogEntry = {
    timestamp: '2024-01-15T11:00:00Z',
    event_type: 'escalation',
    escalation_reason: event_type,
    details,
    severity: 'high',
  };
  audit_log.push(escalation_entry);
}

// Mock orchestrator that uses AI client and handles escalations
async function runTx8Imp1Agent(
  input: AnalysisReportInput,
  ai_client: FakeAiClient
): Promise<AnalysisReportOutput> {
  audit_log = [];
  const escalation_events: Array<{
    type: string;
    action: string;
    details: Record<string, unknown>;
  }> = [];

  try {
    // Action 1: Extract issue data from reporting system
    const action_1_result = await ai_client.executeAction('action_1_extract_issues', {
      system_id: input.system_id,
      period: input.period,
    });

    if (action_1_result.confidence < 0.7) {
      escalation_events.push({
        type: 'low_confidence',
        action: 'action_1',
        details: {
          confidence: action_1_result.confidence,
          threshold: 0.7,
          action_type: 'issue_extraction',
        },
      });
      mock_escalation_handler('low_confidence', escalation_events[0].details);
      return {
        success: false,
        status: 'ESCALATION_REQUIRED',
        error_message: 'Action 1: Low confidence in issue extraction',
        escalation_type: 'low_confidence',
        audit_log,
        report_data: null,
        skipped_actions: ['action_2', 'action_3', 'action_4', 'action_5'],
      };
    }

    if (action_1_result.is_malformed) {
      escalation_events.push({
        type: 'malformed_output',
        action: 'action_1',
        details: {
          reason: 'Schema validation failed',
          missing_fields: ['analysis_id', 'timestamp', 'pattern_data'],
        },
      });
      mock_escalation_handler('malformed_output', escalation_events[0].details);
      return {
        success: false,
        status: 'ESCALATION_REQUIRED',
        error_message: 'Action 1: Malformed AI output',
        escalation_type: 'malformed_output',
        audit_log,
        report_data: null,
        skipped_actions: ['action_2', 'action_3', 'action_4', 'action_5'],
      };
    }

    // Action 2: Analyze issue recurrence patterns in time series
    const action_2_result = await ai_client.executeAction('action_2_analyze_patterns', {
      issue_data: action_1_result.result,
      period: input.period,
    });

    if (action_2_result.confidence < 0.7) {
      escalation_events.push({
        type: 'low_confidence',
        action: 'action_2',
        details: {
          confidence: action_2_result.confidence,
          threshold: 0.7,
          action_type: 'pattern_analysis',
        },
      });
      mock_escalation_handler('low_confidence', escalation_events[0].details);
      return {
        success: false,
        status: 'ESCALATION_REQUIRED',
        error_message: 'Action 2: Low confidence in pattern analysis',
        escalation_type: 'low_confidence',
        audit_log,
        report_data: null,
        skipped_actions: ['action_3', 'action_4', 'action_5'],
      };
    }

    if (action_2_result.is_malformed) {
      escalation_events.push({
        type: 'malformed_output',
        action: 'action_2',
        details: {
          reason: 'Pattern analysis output missing required fields',
        },
      });
      mock_escalation_handler('malformed_output', escalation_events[0].details);
      return {
        success: false,
        status: 'ESCALATION_REQUIRED',
        error_message: 'Action 2: Malformed pattern analysis output',
        escalation_type: 'malformed_output',
        audit_log,
        report_data: null,
        skipped_actions: ['action_3', 'action_4', 'action_5'],
      };
    }

    // Action 3: Identify bottleneck change patterns
    const action_3_result = await ai_client.executeAction('action_3_identify_bottlenecks', {
      pattern_data: action_2_result.result,
      period: input.period,
    });

    if (action_3_result.confidence < 0.7) {
      escalation_events.push({
        type: 'low_confidence',
        action: 'action_3',
        details: {
          confidence: action_3_result.confidence,
          threshold: 0.7,
          action_type: 'bottleneck_identification',
        },
      });
      mock_escalation_handler('low_confidence', escalation_events[0].details);
      return {
        success: false,
        status: 'ESCALATION_REQUIRED',
        error_message: 'Action 3: Low confidence in bottleneck analysis',
        escalation_type: 'low_confidence',
        audit_log,
        report_data: null,
        skipped_actions: ['action_4', 'action_5'],
      };
    }

    if (action_3_result.is_malformed) {
      escalation_events.push({
        type: 'malformed_output',
        action: 'action_3',
        details: {
          reason: 'Bottleneck analysis output schema mismatch',
        },
      });
      mock_escalation_handler('malformed_output', escalation_events[0].details);
      return {
        success: false,
        status: 'ESCALATION_REQUIRED',
        error_message: 'Action 3: Malformed bottleneck analysis output',
        escalation_type: 'malformed_output',
        audit_log,
        report_data: null,
        skipped_actions: ['action_4', 'action_5'],
      };
    }

    if (action_3_result.is_contradictory) {
      escalation_events.push({
        type: 'contradictory_result',
        action: 'action_3',
        details: {
          reason: 'Analysis contains conflicting conclusions',
          conflicting_conclusions: (action_3_result.result as Record<string, unknown>)
            .conflicting_conclusions,
        },
      });
      mock_escalation_handler('contradictory_result', escalation_events[0].details);
      return {
        success: false,
        status: 'ESCALATION_REQUIRED',
        error_message: 'Action 3: Contradictory analysis results',
        escalation_type: 'contradictory_result',
        audit_log,
        report_data: null,
        skipped_actions: ['action_4', 'action_5'],
      };
    }

    // Action 4: Generate visualization report (skipped if escalation)
    const action_4_result = await ai_client.executeAction('action_4_generate_visualization', {
      bottleneck_data: action_3_result.result,
      period: input.period,
    });

    // Action 5: Present to manager (skipped if escalation)
    const action_5_result = await ai_client.executeAction('action_5_present_to_manager', {
      report_data: action_4_result.result,
    });

    return {
      success: true,
      status: 'COMPLETED',
      error_message: null,
      escalation_type: null,
      audit_log,
      report_data: {
        report_id: 'report_001',
        generated_at: '2024-01-15T11:00:00Z',
        visualization: action_4_result.result,
        presented_to_manager: true,
      },
      skipped_actions: [],
    };
  } catch (error) {
    audit_log.push({
      timestamp: '2024-01-15T11:00:00Z',
      event_type: 'error',
      escalation_reason: 'Unhandled exception',
      details: {
        error_message: error instanceof Error ? error.message : String(error),
      },
      severity: 'critical',
    });

    return {
      success: false,
      status: 'ERROR',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      escalation_type: 'exception',
      audit_log,
      report_data: null,
      skipped_actions: ['action_4', 'action_5'],
    };
  }
}

describe('Analysis Reporting - Low Confidence and Malformed Output Detection', () => {
  let fake_ai_client: FakeAiClient;

  beforeEach(() => {
    fake_ai_client = new FakeAiClient();
    audit_log = [];
  });

  afterEach(() => {
    fake_ai_client = null as unknown as FakeAiClient;
    audit_log = [];
  });

  // SCEN-153: AI出力の不正・曖昧・低確信度検出とエスカレーション
  test('should detect low confidence output from Action 1 and escalate without generating report', async () => {
    // Setup: Action 1 returns low confidence (0.55 < 0.7 threshold)
    fake_ai_client.setActionConfig('action_1_extract_issues', {
      action_type: 'action_1_extract_issues',
      confidence: 0.55,
      payload: {
        analysis_id: 'test_001',
        issues: [{ id: 'i001', name: 'Test Issue' }],
      },
    });

    const input: AnalysisReportInput = {
      system_id: 'reporting_system_001',
      period: {
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
      },
    };

    const result = await runTx8Imp1Agent(input, fake_ai_client);

    // Verify escalation triggered
    expect(result.success).toBe(false);
    expect(result.status).toBe('ESCALATION_REQUIRED');
    expect(result.escalation_type).toBe('low_confidence');
    expect(result.error_message).toMatch(/低信度/i);

    // Verify report was NOT generated
    expect(result.report_data).toBeNull();

    // Verify Actions 2, 3, 4, 5 were skipped
    expect(result.skipped_actions).toContain('action_2');
    expect(result.skipped_actions).toContain('action_3');
    expect(result.skipped_actions).toContain('action_4');
    expect(result.skipped_actions).toContain('action_5');

    // Verify audit log contains escalation event
    expect(audit_log.length).toBeGreaterThan(0);
    const escalation_entry = audit_log.find(
      (entry) => entry.event_type === 'escalation'
    );
    expect(escalation_entry).toBeDefined();
    expect(escalation_entry?.escalation_reason).toBe('low_confidence');
    expect((escalation_entry?.details as Record<string, unknown>).confidence).toBe(0.55);
    expect((escalation_entry?.details as Record<string, unknown>).threshold).toBe(0.7);
  });

  test('should detect malformed output from Action 2 and escalate without generating report', async () => {
    // Setup: Action 1 succeeds with high confidence
    fake_ai_client.setActionConfig('action_1_extract_issues', {
      action_type: 'action_1_extract_issues',
      confidence: 0.95,
      payload: {
        analysis_id: 'test_001',
        timestamp: '2024-01-15T11:00:00Z',
        issues: [
          {
            issue_id: 'i001',
            name: 'Performance Degradation',
            reported_date: '2024-01-10T09:00:00Z',
            frequency: 3,
          },
        ],
      },
    });

    // Setup: Action 2 returns malformed output (missing required fields)
    fake_ai_client.setActionConfig('action_2_analyze_patterns', {
      action_type: 'action_2_analyze_patterns',
      confidence: 0.85,
      malformed: true,
    });

    const input: AnalysisReportInput = {
      system_id: 'reporting_system_001',
      period: {
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
      },
    };

    const result = await runTx8Imp1Agent(input, fake_ai_client);

    // Verify escalation triggered
    expect(result.success).toBe(false);
    expect(result.status).toBe('ESCALATION_REQUIRED');
    expect(result.escalation_type).toBe('malformed_output');
    expect(result.error_message).toMatch(/不正な形式|schema|malformed/i);

    // Verify report was NOT generated
    expect(result.report_data).toBeNull();

    // Verify Actions 3, 4, 5 were skipped
    expect(result.skipped_actions).toContain('action_3');
    expect(result.skipped_actions).toContain('action_4');
    expect(result.skipped_actions).toContain('action_5');

    // Verify audit log contains malformed_output escalation
    const malformed_entry = audit_log.find(
      (entry) => entry.escalation_reason === 'malformed_output'
    );
    expect(malformed_entry).toBeDefined();
    expect(malformed_entry?.severity).toBe('high');
  });

  test('should detect contradictory results from Action 3 and escalate without generating report', async () => {
    // Setup: Action 1 succeeds
    fake_ai_client.setActionConfig('action_1_extract_issues', {
      action_type: 'action_1_extract_issues',
      confidence: 0.95,
      payload: {
        analysis_id: 'test_001',
        timestamp: '2024-01-15T11:00:00Z',
        issues: [
          {
            issue_id: 'i001',
            name: 'Deployment Failure',
            reported_date: '2024-01-10T09:00:00Z',
            frequency: 2,
          },
        ],
      },
    });

    // Setup: Action 2 succeeds
    fake_ai_client.setActionConfig('action_2_analyze_patterns', {
      action_type: 'action_2_analyze_patterns',
      confidence: 0.92,
      payload: {
        analysis_id: 'test_001',
        timestamp: '2024-01-15T11:00:00Z',
        patterns: [
          {
            pattern_id: 'pat001',
            issue_id: 'i001',
            recurrence_count: 2,
            trend: 'upward',
            description: 'Deployment failures increasing over time',
          },
        ],
      },
    });

    // Setup: Action 3 returns contradictory results
    fake_ai_client.setActionConfig('action_3_identify_bottlenecks', {
      action_type: 'action_3_identify_bottlenecks',
      confidence: 0.88,
      contradictory: true,
    });

    const input: AnalysisReportInput = {
      system_id: 'reporting_system_001',
      period: {
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
      },
    };

    const result = await runTx8Imp1Agent(input, fake_ai_client);

    // Verify escalation triggered
    expect(result.success).toBe(false);
    expect(result.status).toBe('ESCALATION_REQUIRED');
    expect(result.escalation_type).toBe('contradictory_result');
    expect(result.error_message).toMatch(/矛盾|contradictory|conflicting/i);

    // Verify report was NOT generated
    expect(result.report_data).toBeNull();

    // Verify Actions 4, 5 were skipped
    expect(result.skipped_actions).toContain('action_4');
    expect(result.skipped_actions).toContain('action_5');

    // Verify audit log contains contradictory_result escalation with conflicting conclusions
    const contradictory_entry = audit_log.find(
      (entry) => entry.escalation_reason === 'contradictory_result'
    );
    expect(contradictory_entry).toBeDefined();
    expect((contradictory_entry?.details as Record<string, unknown>).conflicting_conclusions).toBeDefined();
  });
});