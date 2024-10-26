
netflixContainersList = []

/* Config */
observerConfig={
    childList : true,
    subtree: true
}

chrome.runtime.onMessage.addListener(msg => {
    if(msg === "refresh"){
        netflixOnBrowseRefresh()
    }
});

netflixAppMountPoint = document.querySelector("div#appMountPoint");
netflixObserver = new MutationObserver(onBrowseMutationHandler);
netflixObserver.observe(netflixAppMountPoint, observerConfig)


/* 
@param { HTMLElement } pNode, 
@param { string } ottid 
*/
function netflixCreateBtnMark(pNode,ottid){
    const BtnInner = document.createElement("img");
    chrome.storage.local.get(['mark_netflix'], result => {
        mark_netflix = result['mark_netflix']
        if( mark_netflix.includes(ottid) ){
            BtnInner.src = chrome.runtime.getURL("/images/check.png")
        } else{
            BtnInner.src = chrome.runtime.getURL("/images/plus-sign.png")
        }
    })

    BtnInner.style.transition = "all 0.5s"
    BtnInner.style.borderRadius = "18px"

    const BtnMark = document.createElement('button');
    BtnMark.classList.add("btn-mark");
    BtnMark.style.position = "absolute";
    BtnMark.style.right = "0px";
    BtnMark.style.top = "2px";
    BtnMark.style.background = "none";
    BtnMark.style.border = "none"
    BtnMark.style.zIndex = 9999;

    BtnInner.addEventListener('mouseover', netflixBrowseOnMouseOverHandler, false);
    BtnInner.addEventListener('mouseout', netflixBrowseOnMouseOutHandler, false);
    BtnMark.addEventListener('click', netflixBrowseOnClickMarkHandler, false);
    
    BtnMark.appendChild(BtnInner)
    pNode.appendChild(BtnMark)
}

/* @param { PointerEvent } e */
function netflixBrowseOnClickMarkHandler(e){

    let container = e.target.parentNode.parentNode
    let title = container.querySelector('.fallback-text-container').innerText
    let imgUrl = container.querySelector('img').src
    let watchUrl = container.querySelector('a').href
    let ottid = url.split('/')[4].split('?')[0] 

    chrome.storage.local.get(['mark_netflix'], result => {
        mark_netflix = result['mark_netflix']
        if( mark_netflix.includes(ottid) ){ 
            deleteNetflixMarked(ottid)
        }else {
            addNetflixMarked(ottid, imgUrl, title, watchUrl)
        }
        netflixOnBrowseRefresh()
    })
}

/* @param { PointerEvent } e */
function netflixBrowseOnMouseOverHandler(e){
    let container = e.target.parentNode.parentNode
    let url = container.querySelector('a').href
    let ottid = url.split('/')[4].split('?')[0] 
    e.target.style.boxShadow = "0 0 0 3px #FFF inset"
    chrome.storage.local.get(['mark_netflix'], result => {
        mark_netflix = result['mark_netflix']
        if (!mark_netflix.includes(ottid)){
            e.target.src = chrome.runtime.getURL("/images/plus-sign2.png")
        }
    })
}

/* @param { PointerEvent } e */
function netflixBrowseOnMouseOutHandler(e){
    let container = e.target.parentNode.parentNode
    let url = container.querySelector('a').href
    let ottid = url.split('/')[4].split('?')[0] 
    e.target.style.boxShadow = "none"

    chrome.storage.local.get(['mark_netflix'], result => {
        mark_netflix = result['mark_netflix']
        if (!mark_netflix.includes(ottid)){
            e.target.src = chrome.runtime.getURL("/images/plus-sign.png")
        }else{
            e.target.src = chrome.runtime.getURL("/images/checkmark.png")
        }
    })
}

//void --> void
function recognizeContainers() {
    card_containers = document.getElementsByClassName('title-card-container ltr-0');
    for (c of card_containers){
        if (!netflixContainersList.includes(c)){
            title = c.querySelector('.fallback-text-container').innerText
            img = c.querySelector('img').src
            url = c.querySelector('a').href
            ottid = url.split('/')[4].split('?')[0]
            
            netflixCreateBtnMark(c,ottid);
            netflixContainersList.push(c);
        }
    }
}
//void --> void
function netflixOnBrowseRefresh(){
    chrome.storage.local.get(['mark_netflix'], result => {
        mark_netflix = result['mark_netflix']
        for(c of netflixContainersList){
            url = c.querySelector('a').href
            ottid = url.split('/')[4].split('?')[0]
            if(mark_netflix.includes(ottid)){
                btnImg = c.querySelector('button.btn-mark > img')
                btnImg.src = chrome.runtime.getURL('images/check.png')
            }else{
                btnImg = c.querySelector('button.btn-mark > img')
                btnImg.src = chrome.runtime.getURL('images/plus-sign.png')
            }
        }
    })
}

function onBrowseMutationHandler(mutationList, observer) {
    recognizeContainers();
}
