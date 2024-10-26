//@param {string} selector
function waitForElement(selector) {
    return new Promise(resolve => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }
  
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        subtree: true,
        childList: true,
      });
    });
}

//@param {string} selector
function waitForHref(selector) {
    return new Promise(resolve => {
      if (document.querySelector(selector).href) {
        return resolve(document.querySelector(selector).href);
      }
  
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector).href) {
          resolve(document.querySelector(selector).href);
          observer.disconnect();
        }
      });
       
      observer.observe(document.body, {
        subtree: true,
        childList: true,
      });
    });
}

//@param {string} youvidid
function addYouvidMarked(youvidid){
  chrome.storage.sync.get(['mark_youvid'], result => {
    const mark_youvid = result['mark_youvid']

    if(mark_youvid === undefined){
      mark_youvid = []
    }
    // 재생 목록은 '&list' 가 문자열 사이에 추가되므로
    // & 로 시작하는 문자열 제거 (ie. list)
    mark_youvid.push(youvidid.replace(/&.+/g, ''))
    chrome.storage.sync.set({mark_youvid})
  })
}

//@param {number} index
function deleteYouvidMarked(index){
  chrome.storage.sync.get(['mark_youvid'], result => {
    const mark_youvid = result['mark_youvid']
    mark_youvid.splice(index,1)
    chrome.storage.sync.set({mark_youvid})
  })
}

//@param {string} id, imgUrl, title, watchUrl
function addWatchaMarked(id, imgUrl, title, watchUrl){
  content = {
    'imgUrl' : imgUrl,
    'title' : title,
    'watchUrl' : watchUrl
  }
  console.log(content)

  chrome.storage.sync.get(['mark_watcha', 'mark_watcha_data'], result => {
    mark_watcha = result['mark_watcha']
    mark_watcha_data = result['mark_watcha_data']

    if(mark_watcha === undefined){
      mark_watcha = []
    }
    if(mark_watcha_data === undefined){
      mark_watcha_data = []
    }

    mark_watcha.push(id)
    mark_watcha_data.push(content)

    chrome.storage.sync.set({
      mark_watcha : mark_watcha,
      mark_watcha_data : mark_watcha_data
    })
  })
}

//@param {number} index
function deleteWatchaMarked(index){
  console.log(index)
  chrome.storage.sync.get(['mark_watcha', 'mark_watcha_data'], result => {
    mark_watcha = result['mark_watcha']
    mark_watcha_data = result['mark_watcha_data']
    
    mark_watcha.splice(index,1)
    mark_watcha_data.splice(index,1)

    chrome.storage.sync.set({
      mark_watcha : mark_watcha,
      mark_watcha_data : mark_watcha_data
    })
  })
}

//@param {string} id, imgUrl, title, watchUrl
function addNetflixMarked(id, imgUrl, title, watchUrl){
  content = {
    'imgUrl' : imgUrl,
    'title' : title,
    'watchUrl' : watchUrl
  }

  chrome.storage.sync.get(['mark_netflix', 'mark_netflix_data'], result => {
    mark_netflix = result['mark_netflix']
    mark_netflix_data = result['mark_netflix_data']

    if(mark_netflix === undefined){
      mark_netflix = []
    }
    if(mark_netflix_data === undefined){
      mark_netflix_data = []
    }

    mark_netflix.push(id)
    mark_netflix_data.push(content)

    chrome.storage.sync.set({
      mark_netflix : mark_netflix,
      mark_netflix_data : mark_netflix_data
    })
  })
}

//@param {number} index
function deleteNetflixMarked(id){
  chrome.storage.sync.get(['mark_netflix'], result => {
      mark_netflix = result['mark_netflix']
      for(i in arr){
        if(arr[i].id === id){
          mark_netflix.splice(i,1)
          mark_netflix_data.splice(i,1)
          chrome.storage.sync.set({
            mark_netflix : mark_netflix,
            mark_netflix_data : mark_netflix_data
          })
        }
      }
  })
}