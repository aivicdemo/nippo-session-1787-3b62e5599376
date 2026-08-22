import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-178: generates implementation schedule with constraints for 10-member engineering department', async () => {
    const org_id = 'ORG-ENG-001';
    const dept_name = 'エンジニアリング部';
    const dept_size = 10;
    const current_status = 'なし';
    const user_id = 'user-exec-001';
    const execution_timestamp = new Date('2024-01-15T08:00:00Z');

    const org_policy_min_weeks = 2;
    const setup_deadline_days = 3;
    const daily_report_frequency = 1;
    const manager_mail_count = 1;

    const mock_schedule_id = 'SCHED-2024-001';
    const start_date = '2024-01-22';
    const milestone_1_days = 3;
    const milestone_2_days = 2;
    const milestone_3_days = 7;
    const completion_date = '2024-02-05';
    const total_planned_days = milestone_1_days + milestone_2_days + milestone_3_days + 2;

    const mock_ai_response = {
      schedule_id: mock_schedule_id,
      department_id: org_id,
      department_name: dept_name,
      department_size: dept_size,
      current_status: current_status,
      start_date: start_date,
      milestones: [
        {
          sequence: 1,
          name: '研修準備期間',
          duration_days: milestone_1_days,
          target_date: '2024-01-25'
        },
        {
          sequence: 2,
          name: '研修実施期間',
          duration_days: milestone_2_days,
          target_date: '2024-01-27'
        },
        {
          sequence: 3,
          name: 'フィードバック・習熟期間',
          duration_days: milestone_3_days,
          target_date: '2024-02-03'
        }
      ],
      completion_date: completion_date,
      constraints: [
        {
          constraint_id: 'CONST-001',
          description: '10名全員が3日以内に初期セットアップを完了すること'
        },
        {
          constraint_id: 'CONST-002',
          description: '朝会報告は毎朝1回のみ送信であること'
        },
        {
          constraint_id: 'CONST-003',
          description: '部長確認メールは1通のみであること'
        }
      ],
      org_policy_alignment: {
        required_min_weeks: org_policy_min_weeks,
        planned_weeks: Math.ceil(total_planned_days / 7),
        is_compliant: true
      },
      audit_log: {
        executor_id: user_id,
        execution_time: execution_timestamp.toISOString(),
        action_sequence: 1,
        action_name: '導入対象部門の規模と現状を把握し、実施スケジュール案を自動生成する',
        action_start: new Date('2024-01-15T08:00:00Z').toISOString(),
        action_end: new Date('2024-01-15T08:05:00Z').toISOString(),
        schedule_id: mock_schedule_id
      }
    };

    const result = await sendUnsubmittedReminder(org_id, dept_name, dept_size);

    expect(result).toBeDefined();
    expect(result).toEqual(expect.objectContaining({
      schedule_id: mock_schedule_id,
      department_id: org_id,
      department_name: dept_name,
      department_size: 10,
      start_date: start_date,
      completion_date: completion_date
    }));

    expect(result.milestones).toHaveLength(3);
    expect(result.milestones[0]).toEqual(expect.objectContaining({
      sequence: 1,
      name: '研修準備期間',
      duration_days: milestone_1_days
    }));
    expect(result.milestones[1]).toEqual(expect.objectContaining({
      sequence: 2,
      name: '研修実施期間',
      duration_days: milestone_2_days
    }));
    expect(result.milestones[2]).toEqual(expect.objectContaining({
      sequence: 3,
      name: 'フィードバック・習熟期間',
      duration_days: milestone_3_days
    }));

    expect(result.constraints).toHaveLength(3);
    const constraint_descriptions = result.constraints.map(c => c.description);
    expect(constraint_descriptions).toContain('10名全員が3日以内に初期セットアップを完了すること');
    expect(constraint_descriptions).toContain('朝会報告は毎朝1回のみ送信であること');
    expect(constraint_descriptions).toContain('部長確認メールは1通のみであること');

    expect(result.org_policy_alignment).toEqual(expect.objectContaining({
      required_min_weeks: org_policy_min_weeks,
      is_compliant: true
    }));
    expect(result.org_policy_alignment.planned_weeks).toBeGreaterThanOrEqual(org_policy_min_weeks);

    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.executor_id).toBe(user_id);
    expect(result.audit_log.execution_time).toBeDefined();
    expect(result.audit_log.action_sequence).toBe(1);
    expect(result.audit_log.action_name).toBe('導入対象部門の規模と現状を把握し、実施スケジュール案を自動生成する');
    expect(result.audit_log.schedule_id).toBe(mock_schedule_id);

    const idempotent_result = await sendUnsubmittedReminder(org_id, dept_name, dept_size);
    expect(idempotent_result).toEqual(result);
  });
});