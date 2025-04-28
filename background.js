// Simple background script for Quest Save Transfer extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Quest Save Transfer extension installed!');
});

// Listen for tab changes to update extension icon state
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateExtensionState(tab);
  } catch (error) {
    console.error('Error getting tab info:', error);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateExtensionState(tab);
  }
});

// Update extension badge based on current URL
async function updateExtensionState(tab) {
  if (tab.url && tab.url.includes('textadventures.co.uk')) {
    // On a Quest site - check if we have saved data
    const data = await chrome.storage.local.get('savedGameData');
    
    if (tab.url.includes('https://play.textadventures.co.uk/textadventures/')) {
      // Viva player - indicate if we might have data to import
      if (data.savedGameData) {
        chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
        chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#34A853' });
      } else {
        chrome.action.setBadgeText({ tabId: tab.id, text: 'VIVA' });
        chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#FBBC05' });
      }
    }
  } else {
    // Not the Quest Viva player
    chrome.action.setBadgeText({ tabId: tab.id, text: '' });
  }
}