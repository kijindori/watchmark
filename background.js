import {updateCache}  from "./api/client.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['mark_youvid', 'mark_netflix', 'mark_watcha', 'selectedIndex',], function(result){
    if(!result['mark_youvid']){
      chrome.storage.sync.set({mark_youvid : []})
    }
    if(!result['mark_netflix']){
      chrome.storage.sync.set({mark_netflix : []})
      chrome.storage.sync.set({mark_netflix_data : []})
    }
    if(!result['mark_watcha']){
      chrome.storage.sync.set({mark_watcha : []})
      chrome.storage.sync.set({mark_watcha_data : []})
    }
    if(!result['selectedIndex']){
      chrome.storage.sync.set({selectedIndex : 0})
    }
    if(!result['cache']){
      chrome.storage.sync.set({cache : []})
    }
  })
});

//@params
/*
  changes: {
    key : {
      newValue: ...
      oldValue: ...
    }
  }

  namespace : string
*/
chrome.storage.onChanged.addListener(function (changes, namespace) {

  for (var key in changes) {
    var storageChange = changes[key];

    console.log(
      key,
      storageChange.newValue
    );

    if (key.includes('mark')) {
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, 'refresh');
        });
      });

      updateCache();
    }
  }
});

/*
  @params

  tabId : number
  changeInfo : {
    status : string,
  }
  tab:{
    ...
    url : string
  }
*/
chrome.tabs.onUpdated.addListener(
  function (tabId, changeInfo, tab) {
    let id = tabId
    let url = new URL(tab.url)

    if (changeInfo.status == "complete" && url.hostname.includes("www.youtube.com")) {
      chrome.scripting.executeScript({
        target: { tabId: id },
        files: ["contentscripts/youtube.js"]
      })
    }

    if (changeInfo.status == "complete" && url.hostname.includes("www.netflix.com")) {
      chrome.scripting.executeScript({
        target: { tabId: id },
        files: ["contentscripts/netflix.js"]
      })
    }

    if (changeInfo.status == "complete" && url.hostname.includes("watcha.com")) {
      chrome.scripting.executeScript({
        target: { tabId: id },
        files: ["contentscripts/watcha.js"]
      })
    }
  }
);


chrome.runtime.onStartup.addListener(async ()=>{
  updateCache()
});

//chrome.runtime.onMessage.addListener(function (message, sender, senderResponse) {});

