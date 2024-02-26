import { browser, $ } from '@wdio/globals'

export const checkWebview = async () => {
    const workbench = await browser.getWorkbench()
    const webview = await workbench.getWebviewByTitle('My WebView')
    await webview.open()

    await expect($('h1')).toHaveText('Hello World!')
}
