import { test, expect } from '@playwright/test';

test.describe("日報編集フロー", () => {
  // SCEN-643
  test("[normal] 日報編集フロー - 業務フロー「日報編集フロー」を開始から完了まで実行する", async ({
    page,
    request,
  }) => {
    // 一意な値を生成
    const uniqueTimestamp = Date.now();
    const yesterdayText = `実装作業完了_${uniqueTimestamp}`;
    const todayText = `テスト実施_${uniqueTimestamp}`;
    const issueText = `リソース不足_${uniqueTimestamp}`;

    await test.step("工程1: ログイン", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', "test");
      await page.fill('[name="password"]', "test");
      await Promise.all([
        page.waitForURL((url) => !url.toString().includes("/login.html")),
        page.click('button[type="submit"]'),
      ]);
    });

    await test.step("工程2: 日報編集フロー画面を開く", async () => {
      await page.goto("/panels/scr-1787119190590.html");
      await expect(page.locator("id=report-form")).toBeVisible();
    });

    await test.step("工程3: 日報の3項目を入力", async () => {
      // 昨日やったこと
      await page.fill('[name="yesterday_achievement"]', yesterdayText);
      
      // 今日やること
      await page.fill('[name="today_plan"]', todayText);
      
      // 抱えている課題
      await page.fill('[name="issues"]', issueText);
    });

    await test.step("工程4: 入力内容を保存", async () => {
      await page.click('button:has-text("下書き保存")');
      
      // 保存完了メッセージの確認
      const successMessage = page.locator("id=success-message");
      await expect(successMessage).toBeVisible();
    });

    await test.step("工程5: 日報を送信", async () => {
      await page.click('button:has-text("送信")');
      
      // 送信確認ダイアログが表示されることを確認
      const modal = page.locator("id=modalContent");
      await expect(modal).toBeVisible();
      
      // ダイアログ内の送信ボタンを実行
      const submitButton = page.locator('button:has-text("送信")').last();
      await submitButton.click();
    });

    await test.step("工程6: 日報確認・検索画面へ遷移を確認", async () => {
      // 朝会報告管理システム (日報確認・検索画面) へのナビゲーション完了を待機
      await page.waitForURL(/scr-1787119221707/);
      
      // 遷移完了後、日報確認・検索画面のレコード一覧が表示されることを確認
      const recordList = page.locator("id=reports-tbody");
      await expect(recordList).toBeVisible();
    });

    await test.step("工程7: 送信した日報が一覧に表示されていることを確認", async () => {
      // APIを使用して直接データベースを確認
      const apiUrl = await page.evaluate(
        () => (window as any).AIVIC_API_URL
      );
      const appId = await page.evaluate(
        () => (window as any).AIVIC_APP_ID
      );
      const tableIndex = await page.evaluate(
        (name: string) =>
          ((window as any).AIVIC_TABLES || []).findIndex(
            (t: any) => t.tableName === name
          ),
        "朝会報告"
      );

      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      const rows = await res.json();

      // 送信内容が記録に存在するかを確認
      expect(JSON.stringify(rows)).toContain(uniqueTimestamp);
      expect(JSON.stringify(rows)).toContain(yesterdayText);
      expect(JSON.stringify(rows)).toContain(todayText);
      expect(JSON.stringify(rows)).toContain(issueText);
    });

    await test.step("工程8: 画面上の一覧に提出した日報が表示されていることを確認", async () => {
      // ページが完全に読み込まれるまで待機
      await page.waitForLoadState("networkidle");
      
      // 一覧行を取得して、入力したデータが含まれているかを確認
      const reportRows = page.locator("tr[class='report-row']");
      const rowCount = await reportRows.count();
      
      // 少なくとも1行が存在することを確認
      expect(rowCount).toBeGreaterThan(0);
      
      // 最後に追加された行に一意値が含まれていることを確認
      const lastRow = reportRows.nth(rowCount - 1);
      const rowContent = await lastRow.textContent();
      expect(rowContent).toContain(uniqueTimestamp);
    });
  });
});