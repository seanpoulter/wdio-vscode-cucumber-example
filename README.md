# wdio-vscode-cucumber-example

This repo was created to demonstrate [webdriverio-community/wdio-vscode-service#115](https://github.com/webdriverio-community/wdio-vscode-service/pull/115). The following documents how to set up WebdriverIO with TypeScript and Cucumber to test a VS Code extension and the issue with it.

* [Initialize Project](#initialize-project)
* [Unexpected Behaviour](#unexpected-behaviour)

## Initialize Project

Create the project:

```
$ npm init wdio@latest wdio-vscode-cucumber-example

? A project named "wdio-vscode-cucumber-example" was detected at "/home/sean/Development/GitHub/seanpoulter/wdio-vscode-cucumber-example", correct? (Y/n) Y

? What type of testing would you like to do? (Use arrow keys)
❯ VS Code Extension Testing
    > https://webdriver.io/docs/vscode-extension-testing 

? Which framework do you want to use? 
❯ Cucumber (https://cucumber.io/) 

? Do you want to use a compiler? 
❯ TypeScript (https://www.typescriptlang.org/) 

? Which reporter do you want to use? (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
 ◉ spec

? Do you want to add a plugin to your test setup? (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)

? Do you want to add a service to your test setup? (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
 ◉ vscode

? Do you want me to run `npm install` Yes
```

Initialize the Git repo:

```
$ git init
$ git add --all --dry-run
[This incorrectly includes node_modules/.]
```

Add **node_modules/** to **.gitignore**:

```diff
+node_modules/
```

Add the project to version control:

```
$ git add --all
$ git commit -m 'Initialize project'
```

Set up the `"test"` npm script:

```diff
   "scripts": {
-    "wdio": "wdio run ./wdio.conf.ts"
+    "test": "wdio run ./wdio.conf.ts"
   }
```

Run the `"test"` npm script:

```
❯ npm run test

ERROR ... __dirname is not defined in ES module scope
```

Fix the error in **wdio.conf.ts**:

```diff
+import * as url from 'node:url'
+const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
```

Run the `"test"` npm script with the expected result:

```
$ npm run test

ERROR ... No specs found to run, exiting with failure
```

Add the changes to version control:

```
$ git add --all --dry-run
[This incorrectly includes the cache directory.]
```

Add the cache directory to **.gitignore**:

```diff
+.wdio-vscode-service/
 node_modules/
```

Add the changes to version control:

```
$ git add --all
$ git commit -m 'Run tests with no spec files'
```

Move **tsconfig.json** and **wdio.conf.ts** into the **test/** directory:

```
$ mkdir test
$ mv -t test/ tsconfig.json wdio.conf.ts
```

Update the `"test"` npm script:

```diff
   "scripts": {
-    "test": "wdio run ./wdio.conf.ts"
+    "test": "wdio run ./test/wdio.conf.ts"
```

Add the changes to version control:

```
$ git add --all
$ git commit -m 'Move tsconfig.json and wdio.conf.ts.'
```

Create an extension to test. I'll copy the extension from [`webdriverio-community/wdio-vscode-service`](https://github.com/webdriverio-community/wdio-vscode-service/tree/main/test/extension) into **test/extension**:

```
mkdir -p test/extension
cd test/extension
curl --silent --remote-name https://raw.githubusercontent.com/webdriverio-community/wdio-vscode-service/main/test/extension/extension.js
curl --silent --remote-name https://raw.githubusercontent.com/webdriverio-community/wdio-vscode-service/main/test/extension/package.json
cd ../..
```

Configure `wdio` to use this extension:

```diff
+import * as path from 'node:path'
 import * as url from 'node:url'
```
```diff
         'wdio:vscodeOptions': {
             // points to directory where extension package.json is located
-            extensionPath: __dirname,
+            extensionPath: path.join(__dirname, 'extension'),
```

Add the changes to version control:

```
$ git add --all
$ git commit -m 'Add extension under test from webdriverio-community/wdio-vscode-service'
```

Add our first spec in **test/features/webview.feature**:

```cucumber
Feature: Hello World

    As an extension developer
    I want to test if a Webview is displayed

    Scenario: Webview Shows "Hello World!"
        When I open the Webview
        Then I expect that "Hello World!" is displayed
```

Configure `wdio` to find the `.feature` files:

```diff
     specs: [
-        // ToDo: define location for spec files here
+        './features/**/*.feature',
     ],
```

Run the `"test"` npm script.

<details open="open">
<summary>Running on <code>linux-arm64</code>:</summary>
As of 2024-02-24, there is no official <code>chromedriver</code> binary for <code>linux-arm64</code>. WebdriverIO will download the binary for <code>x64</code> and fail unexpectedly:

```
$ npm run test

WARN chromedriver: /tmp/chromedriver/linux-118.0.5993.70/chromedriver-linux64/chromedriver: 1: cannot open @�x�@8
                                                                                                                                                @#@@@����Tb<Tb<�b<�r<�r<����e������@�@��fQ&e��怀@�����PR�tde�����P�tdԣ;ԣ;ԣ;##Q�td���dd/lib64/ld-linux-x86-64.so.2GNU      INFOCrashpad��GNU�aKJU�ck���+v�v�hBa p � �����������0F[bgy���������-5BLZeu�����������/CVbi���������������
                                                                                                                                                                                #-3: No such file
```

We can confirm the architecture with `file` reporting the executable is `x86-64`:

```
$ file /tmp/chromedriver/linux-118.0.5993.70/chromedriver-linux64/chromedriver

/tmp/chromedriver/linux-118.0.5993.70/chromedriver-linux64/chromedriver: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, BuildID[sha1]=cd614b4a55c363147f6ba6e0952b7699768d1668, stripped
```

The workaround is to download ChromeDriver for `linux-arm64` from the corresponding Electron release and configure the capabilities in **wdio.conf.ts**:

```diff
+import * as child_process from 'node:child_process'
+import * as fs from 'node:fs'
+import * as os from 'node:os'
 import * as path from 'node:path'
+import { pipeline } from 'node:stream/promises'
```

```ts
    onPrepare: async function (_config, capabilities) {
        if (!(os.platform() === 'linux' && process.arch === 'arm64')) {
            return
        }

        // Read the cachePath
        type Service = { cachePath?: string } | undefined
        const service = config.services?.find(service =>
            Array.isArray(service)
            && service[0] === 'vscode'
            && typeof service[1] === 'object'
        ) as Service
        const cachePath = service?.cachePath || '.wdio-vscode-service'

        // Modify each VS Code capability
        const caps = Array.isArray(capabilities) ? capabilities : [capabilities]
        for (const cap of caps) {
            if (cap.browserName === 'vscode' && cap['wdio:chromedriverOptions']?.binary === undefined) {
                const vscodeVersion = cap.browserVersion || 'stable'
                let vscodeBranch = vscodeVersion

                // Prefer to use the cached versions
                let electronVersion: string | undefined = undefined
                let cache
                try {
                    const buf = fs.readFileSync(path.join(cachePath, 'versions.txt'))
                    cache = JSON.parse(buf.toString())

                    // Refresh "stable" and "insiders" every releases each day
                    if (vscodeVersion === "stable" || vscodeVersion === "insiders") {
                        const timeout = 24 * 60 * 60 * 1_000
                        const expired = !cache[vscodeVersion].timestamp || Date.now() >= (cache[vscodeVersion].timestamp + timeout)
                        if (!expired) {
                            electronVersion = cache[vscodeVersion].electron
                        }
                    }
                    else {
                        electronVersion = cache[vscodeVersion].electron
                    }
                }
                catch (err) {
                    if (err.code !== 'ENOENT') {
                        throw err
                    }
                }

                // Cache miss
                if (!electronVersion) {
                    // Find the latest release version
                    if (vscodeVersion === 'stable') {
                        const response = await fetch(`https://update.code.visualstudio.com/api/releases/stable`)
                        const body = await response.json()
                        vscodeBranch = body[0]
                    }

                    // Find the version of Electron to download
                    if (vscodeVersion === 'insiders') {
                        vscodeBranch = 'main'
                    }
                    const vscodeManifestResponse = await fetch(`https://raw.githubusercontent.com/microsoft/vscode/${vscodeBranch}/cgmanifest.json`)
                    const vscodeManifestBody = await vscodeManifestResponse.json()
                    electronVersion = vscodeManifestBody.registrations.find(({ component }) => component?.git?.name === 'electron')?.version

                    // Update the cache
                    cache ||= {}
                    cache[vscodeVersion] ||= {}
                    cache[vscodeVersion].electron = electronVersion
                    cache[vscodeVersion].timestamp = Date.now()
                    fs.writeFileSync(path.join(cachePath, 'versions.txt'), JSON.stringify(cache, null, 4))
                }

                // Configure the output paths
                const zipPath = path.join(cachePath, `chromedriver-v${electronVersion}-linux-arm64.zip`)
                const binary = path.join(cachePath, `chromedriver-v${electronVersion}-linux-arm64`, 'chromedriver')

                // Only download when necessary
                if (fs.existsSync(binary)) {
                    console.log(`Skipping download, bundle for ChromeDriver v${electronVersion} already exists`)
                }
                else {
                    // Download the .zip file
                    if (fs.existsSync(zipPath)) {
                        console.log(`Skipping download, chromedriver-v${electronVersion}-linux-arm64.zip already exists`)
                    }
                    else {
                        process.stdout.write(`Downloading chromedriver-v${electronVersion}-linux-arm64.zip...`)
                        const zipResponse = await fetch(`https://github.com/electron/electron/releases/download/v${electronVersion}/chromedriver-v${electronVersion}-linux-arm64.zip`)
                        const writeStream = fs.createWriteStream(zipPath)
                        await pipeline(zipResponse.body, writeStream)
                        console.log('done.')
                    }

                    // Extract the .zip file without an npm package. Assumes it is run from the root directory of the project.
                    await child_process.execSync(`unzip "${path.basename(zipPath)}" -d "${path.basename(zipPath, '.zip')}"`, { cwd: cachePath })
                    fs.rmSync(zipPath)
                }

                // Use the binary for arm64
                cap['wdio:chromedriverOptions'] ||= {}
                cap['wdio:chromedriverOptions'].binary = binary
            }
        }
    },
```

</details>

Add the changes to version control:

```
$ git add --all
$ git commit -m 'Add initial feature and workaround for linux-arm'
```

Define a step, support, and configure Cucumber to find them:

**test/steps/When.ts**:

```ts
import { When } from '@wdio/cucumber-framework'
import { openWebview } from '../support/action/openWebview'

When('I open the Webview', openWebview)

```

**test/support/action/openWebview.ts**:

```ts
import { browser } from '@wdio/globals'

export const openWebview = async () => {
    const workbench = await browser.getWorkbench()
    await workbench.executeCommand('Test Extension: Open WebView')
    await browser.waitUntil(() => workbench.getWebviewByTitle('My WebView'))
}

```

**test/wdio.conf.ts**

```diff
     cucumberOpts: {
         // <string[]> (file/dir) require files before executing features
-        require: ['']
+       require: [
+           './test/steps/**/*.ts'
+       ],
```

Run the `"test"` npm script:

```
$ npm run test

ERROR ... Cannot find module '.../support/action/openWebview' imported from .../steps/When.ts
```

Add the file extension to resolve the module:

```diff
-import { openWebview } from '../support/action/openWebview'
+import { openWebview } from '../support/action/openWebview.js'
```

Run the `"test"` npm script again:

```
$ npm run test
[Evidence the test is running]
[0-0] Error in "0: Then I expect that "Hello World!" is displayed"
Step "I expect that "Hello World!" is displayed" is not defined. You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.
        at Feature(.../features/webview.feature):1:1
        at Scenario(Webview Shows "Hello World!"):6:5
        at Step(I expect that "Hello World!" is displayed):8:9
```

Add the missing step and support and try again.

```
$ git add --all
$ git commit -m 'Add spec that fails flr webdriverio-community/wdio-vscode-service#115'
```

## Unexpected Behaviour

Run the `"test"` npm script:

```
$ npm run test

[0-0] RUNNING in chrome - file:///test/features/webview.feature
[0-0] file:///home/sean/Development/GitHub/seanpoulter/wdio-vscode-cucumber-example/node_modules/wdio-vscode-service/src/service.ts:60
[0-0]         this._promisedSocket = Promise.reject(new Error(msg))
[0-0]                                               ^
[0-0] Error: Connection closed. Code: 1006, reason: 
[0-0]     at VSCodeWorkerService._handleSocketClose (file:///home/sean/Development/GitHub/seanpoulter/wdio-vscode-cucumber-example/node_modules/wdio-vscode-service/src/service.ts:60:47)
[0-0]     at Object.onceWrapper (node:events:629:26)
[0-0]     at WebSocket.emit (node:events:526:35)
[0-0]     at WebSocket.emit (node:domain:488:12)
[0-0]     at WebSocket.emitClose (/home/sean/Development/GitHub/seanpoulter/wdio-vscode-cucumber-example/node_modules/wdio-vscode-service/node_modules/ws/lib/websocket.js:265:10)
[0-0]     at Socket.socketOnClose (/home/sean/Development/GitHub/seanpoulter/wdio-vscode-cucumber-example/node_modules/wdio-vscode-service/node_modules/ws/lib/websocket.js:1289:15)
[0-0]     at Socket.emit (node:events:514:28)
[0-0]     at Socket.emit (node:domain:488:12)
[0-0]     at TCP.<anonymous> (node:net:337:12)
[0-0] FAILED in chrome - file:///test/features/webview.feature

```

This is run with:

```
$ node -v
20.10.0

$ npm ls wdio-vscode-service
wdio-vscode-cucumber-example@ .../wdio-vscode-cucumber-example
└── wdio-vscode-service@6.0.2
```
