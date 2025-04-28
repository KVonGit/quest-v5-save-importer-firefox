// This script runs on Viva player pages
(function() {
  // Extract game ID from URL - this is our reliable fallback
  function getGameIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  }
  
  // Check if we're on a Viva WebPlayer page by URL pattern
  function isVivaWebPlayerUrl() {
    return window.location.href.includes('play.textadventures.co.uk/textadventures/');
  }
  
  // Check URL first before doing anything else
  if (!isVivaWebPlayerUrl()) {
    console.log("Not on a Viva WebPlayer URL, extension features disabled");
    return;
  }

  console.log("On Viva WebPlayer URL, setting up extension features");
  
  // Run the direct import - no need for v5 player interaction
  async function runDirectImport() {
    try {
      // Get the game ID from the URL
      const gameId = getGameIdFromUrl();
      console.log("Using game ID from URL:", gameId);

      // Import the save
      const result = await copyV5SaveToVivaSave(gameId);
      console.log("Save import successful:", result);
      
      // Optionally reload the page
      if (confirm("Save imported successfully. Reload page to load the save?")) {
        window.location.reload();
      }
      
      return result;
    } catch (error) {
      console.error("Error importing save:", error);
      throw error;
    }
  }
  
  // Listen for messages from the popup - using browser.* with polyfill
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'runDirectImport') {
      (async () => {
        try {
          const result = await runDirectImport();
          sendResponse({success: true, result});
        } catch (error) {
          console.error("Error:", error);
          sendResponse({success: false, error: error.toString()});
        }
      })();
      return true; // Indicates we'll respond asynchronously
    }
  });
  
  console.log("Browser message listener set up");
})();