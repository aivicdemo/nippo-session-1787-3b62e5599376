import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-074: [normal] ダッシュボード分析から課題指示までの自動実行 AIエージェント
  // 「ダッシュボード分析から課題指示までの自動実行」が自律処理
  // 「進捗遅延・未提出・異常値を検出して課題として抽出する」を契約どおり実行する
  test('detectAndNotifyUnsubmitted extracts progress delays, unsubmitted users, and anomalies with proper formatting', async () => {
    // テスト環境でのモック進捗データ集約結果
    // 進捗遅延検出ルール: 計画比80%未満
    const aggregatedProgressData = {
      projects: [
        {
          projectId: 'PROJ_A',
          projectName: 'Project A',
          plannedProgress: 100,
          actualProgress: 60,
          detectionTimestamp: new Date('2024-01-15T09:00:00Z'),
        },
        {
          projectId: 'PROJ_B',
          projectName: 'Project B',
          plannedProgress: 100,
          actualProgress: 75,
          detectionTimestamp: new Date('2024-01-15T09:00:00Z'),
        },
        {
          projectId: 'PROJ_C',
          projectName: 'Project C',
          plannedProgress: 100,
          actualProgress: 90,
          detectionTimestamp: new Date('2024-01-15T09:00:00Z'),
        },
      ],
      unsubmittedMembers: [
        { memberId: 'MEM_X', memberName: 'Member X', expectedSubmissionTime: new Date('2024-01-15T08:00:00Z') },
        { memberId: 'MEM_Y', memberName: 'Member Y', expectedSubmissionTime: new Date('2024-01-15T08:00:00Z') },
        { memberId: 'MEM_Z', memberName: 'Member Z', expectedSubmissionTime: new Date('2024-01-15T08:00:00Z') },
      ],
      kpiAnomalies: [
        {
          kpiId: 'KPI_SALES',
          kpiName: 'Sales Achievement Rate',
          achievementRate: 45,
          expectedThreshold: 80,
          detectionTimestamp: new Date('2024-01-15T09:00:00Z'),
        },
      ],
    };

    // Action 2: 進捗遅延・未提出・異常値を検出して課題として抽出する
    // 期待される抽出結果フォーマット
    const expectedExtractedIssues = [
      {
        issueId: 'ISSUE_001',
        issueType: 'PROGRESS_DELAY',
        projectId: 'PROJ_A',
        detectionTimestamp: '2024-01-15T09:00:00Z',
        details: {
          projectName: 'Project A',
          plannedProgress: 100,
          actualProgress: 60,
          delayPercentage: 40,
        },
      },
      {
        issueId: 'ISSUE_002',
        issueType: 'PROGRESS_DELAY',
        projectId: 'PROJ_B',
        detectionTimestamp: '2024-01-15T09:00:00Z',
        details: {
          projectName: 'Project B',
          plannedProgress: 100,
          actualProgress: 75,
          delayPercentage: 25,
        },
      },
      {
        issueId: 'ISSUE_003',
        issueType: 'UNSUBMITTED',
        memberId: 'MEM_X',
        detectionTimestamp: '2024-01-15T09:00:00Z',
        details: {
          memberName: 'Member X',
          expectedSubmissionTime: '2024-01-15T08:00:00Z',
        },
      },
      {
        issueId: 'ISSUE_004',
        issueType: 'UNSUBMITTED',
        memberId: 'MEM_Y',
        detectionTimestamp: '2024-01-15T09:00:00Z',
        details: {
          memberName: 'Member Y',
          expectedSubmissionTime: '2024-01-15T08:00:00Z',
        },
      },
      {
        issueId: 'ISSUE_005',
        issueType: 'UNSUBMITTED',
        memberId: 'MEM_Z',
        detectionTimestamp: '2024-01-15T09:00:00Z',
        details: {
          memberName: 'Member Z',
          expectedSubmissionTime: '2024-01-15T08:00:00Z',
        },
      },
      {
        issueId: 'ISSUE_006',
        issueType: 'KPI_ANOMALY',
        kpiId: 'KPI_SALES',
        detectionTimestamp: '2024-01-15T09:00:00Z',
        details: {
          kpiName: 'Sales Achievement Rate',
          achievementRate: 45,
          expectedThreshold: 80,
          anomalyPercentage: 35,
        },
      },
    ];

    // detectAndNotifyUnsubmitted を呼び出す
    const result = await detectAndNotifyUnsubmitted({
      aggregatedProgressData,
      progressDelayThresholdPercent: 80,
      detectionTimestamp: new Date('2024-01-15T09:00:00Z'),
    });

    // (5) buildAction02Prompt が呼び出され、ACTION_02_PROMPT_VERSION がログに記録されることを確認
    // これはオーケストレーターレベルで検証される想定なので、ここでは結果形式のみ検証

    // (1) 進捗遅延課題2件の抽出を確認
    const progressDelayIssues = result.extractedIssues.filter((issue) => issue.issueType === 'PROGRESS_DELAY');
    expect(progressDelayIssues.length).toBe(2);
    expect(progressDelayIssues[0].projectId).toBe('PROJ_A');
    expect(progressDelayIssues[0].details.actualProgress).toBe(60);
    expect(progressDelayIssues[0].details.delayPercentage).toBe(40);
    expect(progressDelayIssues[1].projectId).toBe('PROJ_B');
    expect(progressDelayIssues[1].details.actualProgress).toBe(75);
    expect(progressDelayIssues[1].details.delayPercentage).toBe(25);

    // (2) 未提出課題3件の抽出を確認
    const unsubmittedIssues = result.extractedIssues.filter((issue) => issue.issueType === 'UNSUBMITTED');
    expect(unsubmittedIssues.length).toBe(3);
    const memberIds = unsubmittedIssues.map((issue) => issue.memberId);
    expect(memberIds).toContain('MEM_X');
    expect(memberIds).toContain('MEM_Y');
    expect(memberIds).toContain('MEM_Z');

    // (3) KPI異常値課題1件の抽出を確認
    const kpiAnomalyIssues = result.extractedIssues.filter((issue) => issue.issueType === 'KPI_ANOMALY');
    expect(kpiAnomalyIssues.length).toBe(1);
    expect(kpiAnomalyIssues[0].kpiId).toBe('KPI_SALES');
    expect(kpiAnomalyIssues[0].details.achievementRate).toBe(45);
    expect(kpiAnomalyIssues[0].details.anomalyPercentage).toBe(35);

    // (4) 各課題が課題ID・検出日時・詳細情報を含む統一フォーマットで構造化されることを確認
    result.extractedIssues.forEach((issue) => {
      expect(issue).toHaveProperty('issueId');
      expect(issue).toHaveProperty('issueType');
      expect(issue).toHaveProperty('detectionTimestamp');
      expect(issue).toHaveProperty('details');

      // 必須フィールドの存在を確認
      expect(typeof issue.issueId).toBe('string');
      expect(issue.issueId.length).toBeGreaterThan(0);

      expect(typeof issue.issueType).toBe('string');
      expect(['PROGRESS_DELAY', 'UNSUBMITTED', 'KPI_ANOMALY']).toContain(issue.issueType);

      expect(typeof issue.detectionTimestamp).toBe('string');
      // ISO 8601 形式の確認
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(issue.detectionTimestamp)).toBe(true);

      expect(typeof issue.details).toBe('object');
      expect(issue.details).not.toBeNull();
    });

    // 総課題数が期待値と一致することを確認
    expect(result.extractedIssues.length).toBe(6);

    // 通知対象者リストが正しく構成されていることを確認
    expect(result.notificationTargets).toBeDefined();
    expect(Array.isArray(result.notificationTargets)).toBe(true);

    // 統計情報の検証
    expect(result.statistics).toBeDefined();
    expect(result.statistics.progressDelayCount).toBe(2);
    expect(result.statistics.unsubmittedCount).toBe(3);
    expect(result.statistics.kpiAnomalyCount).toBe(1);
    expect(result.statistics.totalIssueCount).toBe(6);
  });
});