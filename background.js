
chrome.action.onClicked.addListener(function(tab) {

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

    try {

      chrome.tabs.sendMessage(tab.id, {action: "toggle"});

    } catch (err) {

      console.error("Error sending message:", err);

    }

  });

});