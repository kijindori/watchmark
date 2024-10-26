/*
    유튜브 홈 화면 /browse
    검색 결과 화면 /result
    영상 시청 화면 /watch
*/

var youtubeContainersList = [];
var youtubeResultContainersList = [];  
var youtubeWatchContainersList = [];
var youtubeRefreshContainersList = [];
var youtubeErrList = []
var observerOnResult = undefined
var observerOnBrowse = undefined
var observerOnWatch = undefined
//youtubeShortsContainers = []
//youtubeMixContainers = []

observerConfig={
    childList : true,
    subtree: true
}

onBrowseAppMountPoint = document.querySelector('div#content');
observerOnBrowse = new MutationObserver(youtubeBrowseMutationHandler);
onBrowseAppMountPoint?  observerOnBrowse.observe(onBrowseAppMountPoint, observerConfig) : console.log('onBrowseAppMountPoint Not Found')

mountPointOnResult = document.querySelector('div#content');
observerOnResult = new MutationObserver(youtubeResultMutationHandler);
mountPointOnResult ? observerOnResult.observe(mountPointOnResult, observerConfig) : console.log('mountPointOnResult Not Found')
document.querySelectorAll('.btn-mark')?.forEach( element => element.remove() )


function youtubeBrowseMutationHandler(mutationList, observer) {
    let u = new URL(window.location.href)
    if(u.pathname.length > 1 || u.host !== "www.youtube.com"){ observer.disconnect() }
    else{
        youtubeBrowseRecognizeContainers();
        //youtubeOnBrowseRefresh()
    }
}

function youtubeResultMutationHandler(mutationList, observer) {
    let u = new URL(window.location.href)
    if(u.pathname !== '/results' || u.host !== "www.youtube.com"){ observer.disconnect() }
    else{
        youtubeResultRecognizeContainers();
        youtubeOnResultRefresh()
    }
}

if(window.location.href.includes('watch')){ 
    observerOnResult? observerOnResult.disconnect() : console.log();
    observerOnBrowse? observerOnBrowse.disconnect() : console.log();
    waitForElement('a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer').then(()=>{
        youtubeWatchRecognizeContainer();
    })
    waitForElement('div#columns').then((mountPoint)=>{
        observerOnWatch = new MutationObserver(youtubeBrowseMutationHandler);
        observerOnWatch.observe(mountPoint, observerConfig);
    })
}
/* 
@param { HTMLElement } node, 
@param { string } vid 
*/
function youtubeBrowseCreateBtnMark(node, vid){
    const BtnInner = document.createElement("img");
    chrome.storage.sync.get(['mark_youvid'], result => {
        
        mark_youvid = result['mark_youvid']
        if( mark_youvid.includes(vid) ){
            BtnInner.src = chrome.runtime.getURL("/images/check.png")
        }else{
            BtnInner.src = chrome.runtime.getURL("/images/plus-sign2.png")
        }

    })

    BtnInner.style.transition = "all 0.5s"
    BtnInner.style.borderRadius = "18px"

    const BtnMark = document.createElement('button');
    BtnMark.classList.add("btn-mark");
    BtnMark.style.position = "absolute";
    BtnMark.style.top = "-50px"
    BtnMark.style.right = "0px"
    BtnMark.style.background = "none";
    BtnMark.style.border = "none"
    BtnMark.style.zIndex = 999;
    BtnMark.style.cursor = "pointer"
    
    BtnInner.addEventListener('mouseover', youtubeBrowseOnMouseOverHandler, false);
    BtnInner.addEventListener('mouseout', youtubeBrowseOnMouseOutHandler, false);
    BtnMark.addEventListener('click', youtubeBrowseOnClickMarkHandler, false);
    
    BtnMark.appendChild(BtnInner)
    node.parentNode.querySelector('div#details').appendChild(BtnMark)
    
}

/* @param { PointerEvent } e */
function youtubeBrowseOnClickMarkHandler(e){
    console.log( e.target.closest('#details') )
    thumbnail = e.target.closest('#details').querySelector("a#video-title-link")
    vid = thumbnail?.href.split('/')[3].split('=')[1]
    chrome.storage.sync.get(['mark_youvid'], result => {
        vid=vid.replace(/&[^&]*/g, '') 
        mark_youvid = result['mark_youvid']
        if (mark_youvid.includes(vid)){
            del = mark_youvid.indexOf(vid)
            deleteYouvidMarked(del)
        }else{
            addYouvidMarked(vid)
        } 
        youtubeOnBrowseRefresh()
    })
}

/* @param { PointerEvent } e */
function youtubeBrowseOnMouseOverHandler(e){
    thumbnail = e.target.parentNode.parentNode.querySelector("a#video-title-link")
    url = thumbnail?.href
    if(url){
        url = url.split('/')
        // 쇼츠를 제외한 영상만 처리
        if(!url.includes("shorts") && url[3]){
            vid = url[3].split('=')[1]
            e.target.style.boxShadow = "0 0 0 3px #d0d0d0 inset"
            youtubeOnBrowseRefresh()
        }
    }
}

/* @param { PointerEvent } e */
function youtubeBrowseOnMouseOutHandler(e){
    thumbnail = e.target.parentNode.parentNode.querySelector("a#video-title-link")
    url = thumbnail?.href
    if(url){
        url = url.split('/')
        if(!url.includes("shorts") && url[3]){
            vid = url[3].split('=')[1]
            youtubeOnBrowseRefresh()
            e.target.style.boxShadow = "none"
        }
    }
}

// void --> void
function youtubeBrowseRecognizeContainers() {
    const cards = document.querySelectorAll('div#content.style-scope.ytd-rich-item-renderer');
    for (c of cards){
        if (!youtubeContainersList.includes(c)){
            youtubeContainersList.push(c)
            const thumbnail = c.querySelector('a#thumbnail')

            let url = thumbnail?.href
            const isSponsored = c.querySelector('div#thumbnail-container')?.getAttribute('aria-label').includes('광고')
            if(url && !isSponsored){  
                url = url.split('/')
                // 쇼츠를 제외한 영상만 처리
                // 쇼츠 영상 url 에는 "shorts" 가 포함됩니다.
                if(!url.includes("shorts") && url[3]){
                    vid = url[3].split('=')[1]
                    vid=vid.replace(/&[^&]*/g, '')
                    youtubeBrowseCreateBtnMark(c, vid)
                    youtubeContainersList.push(c)
                }
            }else{  // 유튜브 광고, 쇼츠, 믹스, 설문조사 등...
                // 추후에 광고, 쇼츠, 믹스 ,설문조사 에 대한 처리가 필요하면 작성할 부분.

            }
        }
    }
}

// void --> void
function youtubeOnBrowseRefresh(){
    chrome.storage.sync.get(['mark_channel_name', 'mark_youvid'], result => {
        mark_channel_name = result["mark_channel_name"]
        mark_youvid = result['mark_youvid']

        for(c of youtubeContainersList){
            url = c.querySelector('a#thumbnail')?.href
            const isSponsored = c.querySelector('div#thumbnail-container')?.getAttribute('aria-label').includes('광고')
            if( url && !url.includes('shorts') && !isSponsored ){
                vid = url.split('/')[3].split('=')[1]
                vid = vid.replace(/&[^&]*/g, '')
                title = (c.querySelector("a#avatar-link")?.title === "undefined")
    
                if(title){
                    //유튜브 믹스에 대한 처리가 필요하면 작성할 부분
                    //youtubeBrowseCreateBtnMarkMix(c)
                }
    
                btnMarkImg = c.querySelector('button.btn-mark > img')
                if( btnMarkImg  ){
                    if( mark_youvid.includes(vid) && vid ){
                        btnMarkImg.src = chrome.runtime.getURL('/images/check.png')
                    }else{
                        btnMarkImg.src = chrome.runtime.getURL('/images/plus-sign2.png')
                    }
                }else{
                    youtubeBrowseCreateBtnMark(c, vid)
                }
            }
        }
    })
}

/* 
@param { HTMLElement } node, 
@param { string } vid 
*/
function youtubeResultCreateBtnMarkElement(node, vid){
    const BtnInner = document.createElement("img");
    chrome.storage.sync.get(['mark_youvid'], result => {

        mark_youvid = result['mark_youvid']
        if( mark_youvid.includes(vid) ){
            BtnInner.src = chrome.runtime.getURL("/images/check.png")
        }else{
            BtnInner.src = chrome.runtime.getURL("/images/plus-sign2.png")
        }
    })

    BtnInner.style.transition = "all 0.5s"
    BtnInner.style.borderRadius = "18px"

    const BtnMark = document.createElement('button');
    BtnMark.classList.add('btn-mark')
    BtnMark.style.position = "absolute";
    BtnMark.style.right = "32px"
    BtnMark.style.top = "-7px"
    BtnMark.style.background = "none";
    BtnMark.style.border = "none"
    BtnMark.style.zIndex = 10;
    BtnMark.style.cursor = "pointer"

    BtnInner.addEventListener('mouseover', youtubeResultOnMouseOverHandler, false);
    BtnInner.addEventListener('mouseout', youtubeResultOnMouseOutHandler, false);
    BtnMark.addEventListener('click', youtubeResultOnClickMarkHandler, false);
    
    BtnMark.appendChild(BtnInner)
    node.appendChild(BtnMark)
}

/* @param { PointerEvent } e */
function youtubeResultOnClickMarkHandler(e){
    thumbnail = e.target.closest('#dismissible').querySelector("a#thumbnail")
    url = thumbnail?.href
    if(url){
        if(!url.includes("shorts")){
            vid = url.split('/')[3].split('=')[1].slice(0,-3)
        }
    }
    chrome.storage.sync.get(['mark_youvid'], result => {
        mark_youvid = result['mark_youvid']

        if (mark_youvid.includes(vid)){
            idx = mark_youvid.indexOf(vid)
            deleteYouvidMarked(idx)
            e.target.src = chrome.runtime.getURL("/images/plus-sign2.png")
        }else{
            addYouvidMarked(vid)
            e.target.src = chrome.runtime.getURL("/images/check.png")
        } 
    })
}

/* @param { PointerEvent } e */
function youtubeResultOnMouseOverHandler(e){
    e.target.style.boxShadow = "0 0 0 4px #a7a7a7 inset"
}
/* @param { PointerEvent } e */
function youtubeResultOnMouseOutHandler(e){
    e.target.style.boxShadow = "none"
}

// void --> void
function youtubeResultRecognizeContainers() {
    cards = document.querySelectorAll('div#dismissible.style-scope.ytd-video-renderer');
    // 각 container 별로 버튼 추가 및 배열에 저장
    for (c of cards){
        if (!youtubeResultContainersList.includes(c)){
            thumbnail = c.querySelector('a#thumbnail')
            url = thumbnail?.href
            if(c.querySelector('a#channel-thumbnail')?.href.includes('@')){
                channelName = c.querySelector('a#channel-thumbnail')?.href.split('@')[1]
            }else{
                channelName = c.querySelector('a#channel-thumbnail')?.href.split('/')[4]
            }
            
            if(!url.includes("shorts") && channelName ){
                vid = url.split('/')[3].split('=')[1].slice(0,-3)
                youtubeResultCreateBtnMarkElement(c, vid)
                youtubeResultContainersList.push(c)
            }
        }
    }
}
// void --> void
function youtubeOnResultRefresh(){
    if(!window.location.href.includes('/result')){
        chrome.storage.sync.get(['mark_youvid'], result => {
            mark_youvid = result['mark_youvid']
            
            for(c of youtubeResultContainersList){
                channelUrl = c.querySelector("a#channel-thumbnail").href
                if(channelUrl.split('/')[3].includes('@')){
                    channelName= channelUrl.split('/')[3].slice(1,)
                }else{
                    channelName= channelUrl.split('/')[4]
                }
                vid = c.querySelector('a#thumbnail').href.split('/')[3].split('=')[1].slice(0,-3)
                if(mark_youvid.includes(vid)){
                    btnImg = c.querySelector('button.btn-mark > img')
                    btnImg.src = chrome.runtime.getURL('/images/check.png')
                }else{
                    btnImg = c.querySelector('button.btn-mark > img')
                    btnImg.src = chrome.runtime.getURL('/images/plus-sign2.png')
                }
            }
        })
    }
}

/* @param { PointerEvent } e */
function youtubeWatchOnClickMarkHandler(e){
    vid = window.location.href.split('=')[1]
    chrome.storage.sync.get(['mark_youvid'], result => {
        vid=vid.replace(/&[^&]*/g, '')
        mark_youvid = result['mark_youvid']
        if (mark_youvid.includes(vid)){
            del = mark_youvid.indexOf(vid)
            deleteYouvidMarked(del)
            e.target.src = chrome.runtime.getURL("/images/plus-sign2.png")
        }else{
            addYouvidMarked(vid)
            e.target.src = chrome.runtime.getURL("/images/check.png")
        } 
    })
}

/* @param { PointerEvent } e */
function youtubeWatchOnMouseOverHandler(e){
    e.target.style.boxShadow = "0 0 0 4px #a7a7a7 inset"
}


/* @param { PointerEvent } e */
function youtubeWatchOnMouseOutHandler(e){
    e.target.style.boxShadow = "none"
}


// void --> void
function youtubeOnWatchRefresh(){
    console.log('onWatchRefresh')
    // url 에 /watch 가 포함되었는지 확인 후 refresh
    if(window.location.href.includes('watch')){
        let container = document.body.querySelector('div#owner.item.style-scope.ytd-watch-metadata')
        if(container.querySelector('a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer').href.split('/')[3].includes('@')){
            channelName= container.querySelector('a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer').href.split('/')[3].slice(1,)
        }else{
            channelName= container.querySelector('a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer').href.split('/')[3]
        }
        let vid = window.location.href.split('=')[1]   
        vid=vid.replace(/&[^&]*/g, '')
        chrome.storage.sync.get(['mark_youvid'], result => {
            mark_youvid = result['mark_youvid']
    
            if(mark_youvid.includes(vid)){
                btnImg = container.querySelector('button.btn-mark > img')
                btnImg.src = chrome.runtime.getURL('/images/check.png')
            }else{
                btnImg = container.querySelector('button.btn-mark > img')
                btnImg.src = chrome.runtime.getURL('/images/plus-sign2.png')
            }
        })
    }
}

// void --> void
function youtubeWatchRecognizeContainer(){
    container = document.body.querySelector('div#owner.item.style-scope.ytd-watch-metadata')
    waitForElement('a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer').then(( element )=>{
        // **Deprecated**
        // if(element.href.split('/')[3].includes('@')){
        //     channelName= container.querySelector('a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer')?.href.split('/')[3].slice(1,)
        // }else{
        //     channelName= container.querySelector('a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer')?.href.split('/')[3]
        // }

        vid = window.location.href.split('=')[1]

        if(!youtubeWatchContainersList.includes(container) && vid){

            // Create Button for marking.
            const BtnMark = document.createElement('button');
            const BtnMarkInner = document.createElement("img");
        
            chrome.storage.sync.get(['mark_youvid'], result => {
                mark_youvid = result['mark_youvid']
                if( mark_youvid.includes(vid) ){
                    // 이미 추가된 항목이라면 체크 표시
                    BtnMarkInner.src = chrome.runtime.getURL("/images/check.png")
                }else{
                    //아직 추가되지 않은 항목이라면 추가 표시
                    BtnMarkInner.src = chrome.runtime.getURL("/images/plus-sign2.png")
                }
            })
        
            BtnMarkInner.style.transition = "all 0.5s"
            BtnMarkInner.style.borderRadius = "18px"
        
            BtnMark.classList.add("btn-mark");
            BtnMark.style.position = "absolute";
            BtnMark.style.right = "0px";
            BtnMark.style.top = "-7px";
            BtnMark.style.background = "none";
            BtnMark.style.border = "none"
            BtnMark.style.zIndex = 9999;
            BtnMark.style.cursor = "pointer"
        
            BtnMarkInner.addEventListener('mouseover', youtubeWatchOnMouseOverHandler, false);
            BtnMarkInner.addEventListener('mouseout', youtubeWatchOnMouseOutHandler, false);
            BtnMark.addEventListener('click', youtubeWatchOnClickMarkHandler, false);
        
            BtnMark.appendChild(BtnMarkInner)
            container.appendChild(BtnMark)
            console.log(BtnMark.parentNode)
            youtubeWatchContainersList.push(container)
        }    
    })
}

// 본래 api 에서는 { any } 타입으로 msg 를 보낼 수 있지만,
// string 만 사용함
// @param { string } msg
chrome.runtime.onMessage.addListener(msg => {
    if(msg === "refresh"){
        youtubeOnBrowseRefresh()
        youtubeOnResultRefresh()
        youtubeOnWatchRefresh()
    }
});

