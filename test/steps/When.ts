import { When } from '@wdio/cucumber-framework'
import { openWebview } from '../support/action/openWebview.js'

When('I open the Webview', openWebview)
