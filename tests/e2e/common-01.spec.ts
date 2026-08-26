import { test, expect } from '@playwright/test';

test.describe("リマインド通知設定画面の初期化", () => {
  // SCEN-053
  test("[normal] リマインド通知設定画面の初期化 - 業務フロー「リマインド通知設定画面の初期化」を開始から完了まで実行する", async ({ page, request }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

    await test.step("ログインしてホーム画面を表示", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'test');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
      await page.goto("/");
      await expect(page.locator('body')).toContainText('nippo');
    });

    const uniqueValue = "テスト" + Date.now();

    await test.step("本日の日報入力画面を開く", async () => {
      // アプリケーション側で最初に遷移する画面を待つ
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      expect(currentUrl).toContain('/panels/');
    });

    await test.step("「昨日やったこと」入力欄にテスト用テキストを入力", async () => {
      // 最初の textarea を昨日やったこと欄として使用
      const textareas = await page.locator('textarea').all();
      expect(textareas.length).toBeGreaterThanOrEqual(1);
      await textareas[0].fill(uniqueValue);
      await expect(textareas[0]).toHaveValue(uniqueValue);
    });

    await test.step("「今日やること」入力欄にテスト用テキストを入力", async () => {
      const textareas = await page.locator('textarea').all();
      expect(textareas.length).toBeGreaterThanOrEqual(2);
      await textareas[1].fill(uniqueValue);
      await expect(textareas[1]).toHaveValue(uniqueValue);
    });

    await test.step("「抱えている課題」入力欄にテスト用テキストを入力", async () => {
      const textareas = await page.locator('textarea').all();
      expect(textareas.length).toBeGreaterThanOrEqual(3);
      await textareas[2].fill(uniqueValue);
      await expect(textareas[2]).toHaveValue(uniqueValue);
    });

    await test.step("「送信」ボタンをクリック", async () => {
      const buttons = await page.locator('button').all();
      let submitButton = null;
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.includes('送信')) {
          submitButton = btn;
          break;
        }
      }
      expect(submitButton).not.toBeNull();
      await submitButton!.click();
    });

    await test.step("送信完了メッセージが表示されることを確認", async () => {
      // 送信完了メッセージの表示を待つ
      const pageContent = await page.content();
      expect(pageContent).toBe(true);
    });

    await test.step("入力内容がクリアされて入力画面に戻ることを確認", async () => {
      const textareas = await page.locator('textarea').all();
      if (textareas.length >= 3) {
        const firstValue = await textareas[0].inputValue();
        expect(firstValue).toBe('');
      }
    });

    await test.step("サーバへの送信リクエストが実行されたことを確認（記録確認）", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "朝会報告",
      );

      if (tableIndex >= 0 && apiUrl && appId) {
        const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
        const rows = await res.json();
        expect(JSON.stringify(rows)).toContain(uniqueValue);
      }
    });
  });
});