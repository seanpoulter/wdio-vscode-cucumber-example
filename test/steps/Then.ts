import { Then } from '@wdio/cucumber-framework'
import { checkWebview } from '../support/check/checkWebview.js'

Then('I expect that "Hello World!" is displayed', checkWebview)
