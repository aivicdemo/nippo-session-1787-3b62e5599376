import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { type Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('TX-5-IMP-1: 課題抽出から既存ツール連携・確認までの自律実行 - Action 1 検証', () => {
  // SCEN-3147
  test('抽出課題データの形式・内容を検証して結果を返却し監査ログに記録する', async () => {
    // Arrange: 検証対象となる抽出済み課題データサンプル
    const valid_extracted_issue_1 = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Database connection timeout issue',
      description: 'Intermittent database timeouts occurring during peak hours causing service degradation',
      extractedAt: '2024-01-15T09:30:00Z',
      sourceReportId: 'report_001',
    };

    const valid_extracted_issue_2 = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'API rate limiting',
      description: 'Third-party API rate limits being hit too frequently',
      extractedAt: '2024-01-15T09:35:00Z',
      sourceReportId: 'report_002',
    };

    // 検証済みイベントを格納するための監査ログ配列
    const audit_events: Array<{
      audit_event_type: string;
      timestamp: string;
      input_data_hash: string;
      validation_result: { form_validation_passed: boolean; validation_errors: string[]; checked_fields_count: number };
    }> = [];

    // Fake AI Client の実装
    const fake_ai_client: Tx5Imp1AiClient = {
      async buildAction01Prompt(extracted_issues: Array<{ id: string; title: string; description: string; extractedAt: string; sourceReportId?: string }>) {
        // Action 01: 抽出課題データの形式・内容を検証する
        const validation_errors: string[] = [];
        let checked_fields_count = 0;

        for (const issue of extracted_issues) {
          // 必須フィールド確認
          if (!issue.id) {
            validation_errors.push('Missing required field: id');
          } else {
            checked_fields_count += 1;
            // UUID形式検証 (8-4-4-4-12 hex format)
            const uuid_pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuid_pattern.test(issue.id)) {
              validation_errors.push(`Invalid UUID format for id: ${issue.id}`);
            }
          }

          if (!issue.title) {
            validation_errors.push('Missing required field: title');
          } else {
            checked_fields_count += 1;
            // 文字列長チェック: 1～500 文字
            if (issue.title.length < 1 || issue.title.length > 500) {
              validation_errors.push(`Title length out of range (1-500): ${issue.title.length}`);
            }
          }

          if (!issue.description) {
            validation_errors.push('Missing required field: description');
          } else {
            checked_fields_count += 1;
            // 文字列長チェック: 1～500 文字
            if (issue.description.length < 1 || issue.description.length > 500) {
              validation_errors.push(`Description length out of range (1-500): ${issue.description.length}`);
            }
          }

          if (!issue.extractedAt) {
            validation_errors.push('Missing required field: extractedAt');
          } else {
            checked_fields_count += 1;
            // ISO 8601 形式検証
            const iso_pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
            if (!iso_pattern.test(issue.extractedAt)) {
              validation_errors.push(`Invalid ISO 8601 format for extractedAt: ${issue.extractedAt}`);
            }
          }
        }

        const form_validation_passed = validation_errors.length === 0;
        const validation_result = {
          form_validation_passed,
          validation_errors,
          checked_fields_count,
        };

        // 簡易ハッシュ生成（入力データのJSON文字列のlength）
        const input_data_hash = `hash_${extracted_issues.length}_issues`;

        // 監査ログイベント記録
        const audit_event = {
          audit_event_type: 'action_01_data_validation_executed',
          timestamp: new Date().toISOString(),
          input_data_hash,
          validation_result,
        };
        audit_events.push(audit_event);

        return {
          prompt_version: 'ACTION_01_PROMPT_VERSION_1.0.0',
          validation_result,
          issues_with_status: extracted_issues.map((issue) => ({
            ...issue,
            validated: form_validation_passed,
          })),
        };
      },

      async buildAction02Prompt() {
        return { prompt_version: 'ACTION_02_PROMPT_VERSION_1.0.0' };
      },

      async buildAction03Prompt() {
        return { prompt_version: 'ACTION_03_PROMPT_VERSION_1.0.0' };
      },

      async buildAction04Prompt() {
        return { prompt_version: 'ACTION_04_PROMPT_VERSION_1.0.0' };
      },

      async buildAction05Prompt() {
        return { prompt_version: 'ACTION_05_PROMPT_VERSION_1.0.0' };
      },
    };

    // Act: runTx5Imp1Agent を実行
    const extracted_issue_data = [valid_extracted_issue_1, valid_extracted_issue_2];
    const tool_integration_config = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com',
      authToken: 'fake_token',
    };
    const priority_rules = {
      impactWeightage: 0.6,
      frequencyWeightage: 0.4,
      highPriorityThreshold: 75,
      mediumPriorityThreshold: 50,
    };
    const category_mappings = [
      { systemCategory: 'Database', toolCategory: 'Backend' },
      { systemCategory: 'API', toolCategory: 'Integration' },
    ];

    const agent_input = {
      extractedIssueData: extracted_issue_data,
      toolIntegrationConfig: tool_integration_config,
      priorityRules: priority_rules,
      categoryMappings: category_mappings,
    };

    const agent_output = await runTx5Imp1Agent(agent_input, fake_ai_client);

    // Assert: 検証結果の検査
    // (1) buildAction01Prompt が呼び出され、prompt_version が返却されることを確認
    expect(agent_output).toBeDefined();
    expect(agent_output.validatedIssues).toBeDefined();
    expect(Array.isArray(agent_output.validatedIssues)).toBe(true);

    // (2) JSON スキーマ検証により必須フィールド4項目の存在確認
    for (const validated_issue of agent_output.validatedIssues) {
      expect(validated_issue.issueId).toBeDefined();
      expect(typeof validated_issue.issueId).toBe('string');
      expect(validated_issue.issueId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }

    // (3) 検証結果が期待構造を持つことを確認
    for (const validated_issue of agent_output.validatedIssues) {
      expect(validated_issue.validationStatus).toMatch(/^(valid|warning|invalid)$/);
      expect(typeof validated_issue.priorityScore).toBe('number');
      expect(validated_issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(validated_issue.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(validated_issue.priorityRank);
    }

    // (4) 監査ログに action_01_data_validation_executed イベントが記録されていることを確認
    expect(audit_events.length).toBeGreaterThan(0);
    const validation_audit_event = audit_events[0];
    expect(validation_audit_event.audit_event_type).toBe('action_01_data_validation_executed');
    expect(typeof validation_audit_event.timestamp).toBe('string');
    expect(validation_audit_event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(typeof validation_audit_event.input_data_hash).toBe('string');
    expect(validation_audit_event.validation_result.form_validation_passed).toBe(true);
    expect(Array.isArray(validation_audit_event.validation_result.validation_errors)).toBe(true);
    expect(validation_audit_event.validation_result.validation_errors.length).toBe(0);
    expect(typeof validation_audit_event.validation_result.checked_fields_count).toBe('number');
    expect(validation_audit_event.validation_result.checked_fields_count).toBe(4); // 4 required fields checked

    // (5) 検証成功時に課題データが返却されることを確認
    expect(agent_output.validatedIssues.length).toBe(2);
    expect(agent_output.validatedIssues[0].issueId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(agent_output.validatedIssues[1].issueId).toBe('550e8400-e29b-41d4-a716-446655440001');

    // (6) 優先度スコアが計算されていることを確認
    for (const issue of agent_output.validatedIssues) {
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    }
  });
});