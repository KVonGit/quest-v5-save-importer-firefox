document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const transferButton = document.getElementById('transferSave');
  let currentTab = null;

  // Initialize the popup based on the current tab
  async function initialize() {
    try {
      // Get the current active tab - using browser.* instead of chrome.*
      const tabs = await browser.tabs.query({active: true, currentWindow: true});
      currentTab = tabs[0];
      
      // Check if we're on a Viva player page
      if (currentTab.url.includes('play.textadventures.co.uk/textadventures/')) {
        statusElement.textContent = 'Ready to import v5 save to this game.';
        transferButton.disabled = false;
      } else {
        statusElement.textContent = 'Not on a Viva WebPlayer page.';
        transferButton.disabled = true;
      }
    } catch (error) {
      statusElement.textContent = 'Error: ' + error.message;
      console.error(error);
    }
  }

  // Handle the import button click
  transferButton.addEventListener('click', async function() {
    try {
      statusElement.textContent = 'Importing save...';
      transferButton.disabled = true;
      
      // Tell the content script to run the import directly - using browser.* API
      const response = await browser.tabs.sendMessage(currentTab.id, {
        action: 'runDirectImport'
      });
      
      if (response && response.success) {
        statusElement.textContent = 'Save imported successfully!';
      } else {
        statusElement.textContent = 'Error importing save: ' + (response?.error || 'Unknown error');
      }
    } catch (error) {
      statusElement.textContent = 'Error: ' + error.message;
      console.error(error);
    } finally {
      transferButton.disabled = false;
    }
  });

  // Initialize the popup
  initialize();
});