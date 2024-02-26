import { browser } from '@wdio/globals'

export const openWebview = async () => {
    const workbench = await browser.getWorkbench()
    await workbench.executeCommand('Test Extension: Open WebView')
    await browser.waitUntil(() => workbench.getWebviewByTitle('My WebView'))
}
