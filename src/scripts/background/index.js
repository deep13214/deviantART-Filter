import BrowserPageAction from './browser-page-action';
import BrowserRuntime from './browser-runtime';
import BrowserStorage from './browser-storage';
import BrowserTabs from './browser-tabs';

browser.tabs.onUpdated.addListener(BrowserTabs.onTabUpdated.bind(BrowserTabs));
browser.pageAction.onClicked.addListener(BrowserPageAction.onPageActionClicked.bind(BrowserPageAction));
browser.runtime.onMessage.addListener(BrowserRuntime.onRuntimeMessage.bind(BrowserRuntime));
browser.runtime.onInstalled.addListener(BrowserRuntime.onRuntimeInstalled.bind(BrowserRuntime));
browser.storage.onChanged.addListener(BrowserStorage.onStorageChanged.bind(BrowserStorage));
