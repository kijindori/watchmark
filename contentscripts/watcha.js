watchaContainersList = []
observerConfig={
    childList : true,
    subtree: true
}
chrome.runtime.onMessage.addListener(msg => {
    if(msg === "refresh"){
        watchaOnBrowseRefresh()
        watchaOnContentsRefresh()
    }
});

appMountPoint = document.querySelector("main");
watchaObserver = new MutationObserver(onWatchaMutationHandler);
watchaObserver.observe(appMountPoint, observerConfig)

function onWatchaMutationHandler(mutationList, observer) {
    recognizeContainers();
}

waitForElement('section.e1kgye4v2').then( container => {
    l = window.location.pathname
    console.log(l)
    ottid = l.split('/').at(-1)
    watchaContentsCreateBtnMark(container, ottid)
})

/* 
@param { HTMLElement } pnode, 
@param { string } ottid 
*/
function watchaBrowseCreateBtnMarkElement(pNode,ottid){
    const BtnInner = document.createElement("img");
    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        if( mark_watcha.includes(ottid) ){
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
    BtnMark.style.right = "17px";
    BtnMark.style.top = "2px";
    BtnMark.style.background = "none";
    BtnMark.style.border = "none"
    BtnMark.style.zIndex = 9999;

    BtnInner.addEventListener('mouseover', watchaBrowseOnMouseOverHandler, false);
    BtnInner.addEventListener('mouseout', watchaBrowseOnMouseOutHandler, false);
    BtnMark.addEventListener('click', watchaBrowseOnClickMarkHandler, false);

    BtnMark.appendChild(BtnInner)
    pNode.appendChild(BtnMark)
}

/* @param { PointerEvent } e */
function watchaBrowseOnClickMarkHandler(e){
    let container = e.target.parentNode.parentNode
    let img = container.querySelector('img')
    let imgsrc = img.src
    let title = "null"
    let ottid = container.querySelector('a')?.href.split('/')[4]
    if(ottid.includes('?')){ ottid = ottid.split('?')[0]}
    let url = "https://watcha.com/watch/"+ ottid

    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        if( mark_watcha.includes(ottid) ){
            index = mark_watcha.indexOf(ottid)
            deleteWatchaMarked(index)
        }else {
            addWatchaMarked(ottid, imgsrc, title, url)
        }

        watchaOnBrowseRefresh()
    })
}

/* @param { PointerEvent } e */
function watchaBrowseOnMouseOverHandler(e){
    let container = e.target.parentNode.parentNode
    let ottid = container.querySelector('a')?.href.split('/')[4]
    if(ottid.includes('?')){ ottid = ottid.split('?')[0]}
    e.target.style.boxShadow = "0 0 0 3px #FFF inset"

    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        if (!mark_watcha.includes(ottid)){
            e.target.src = chrome.runtime.getURL("/images/plus-sign2.png")
        }
    })
}

/* @param { PointerEvent } e */
function watchaBrowseOnMouseOutHandler(e){
    let container = e.target.closest('li')
    let ottid = container.querySelector('a')?.href.split('/')[4]
    if(ottid.includes('?')){ ottid = ottid.split('?')[0]}
    e.target.style.boxShadow = "none"

    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        if (!mark_watcha.includes(ottid)){
            e.target.src = chrome.runtime.getURL("/images/plus-sign.png")
        }else{
            e.target.src = chrome.runtime.getURL("/images/checkmark.png")
        }
    })
}

// void --> void
function recognizeContainers() {
    card_containers = document.getElementsByClassName('custom-uvitkv-Cell etpnybg0');
    for (c of card_containers){
        if (!watchaContainersList.includes(c)){
            ottid = c.querySelector('a')?.href.split('/')[4]
            if(ottid){
                if(ottid.includes('?')){ ottid = ottid.split('?')[0]}
                watchaBrowseCreateBtnMarkElement(c,ottid);
                watchaContainersList.push(c);
            }
        }
    }
}

// void --> void
function watchaOnBrowseRefresh(){
    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        for(c of watchaContainersList){
            let ottid = c.querySelector('a')?.href.split('/')[4]
            if(ottid.includes('?')){ ottid = ottid.split('?')[0]}
            
            if(mark_watcha.includes(ottid)){
                btnImg = c.querySelector('button.btn-mark > img')
                btnImg.src = chrome.runtime.getURL('images/check.png')
            }else{
                btnImg = c.querySelector('button.btn-mark > img')
                btnImg.src = chrome.runtime.getURL('images/plus-sign.png')
            }
        }
    })
}

/* 
@param { HTMLElement } pnode, 
@param { string } ottid 
*/
function watchaContentsCreateBtnMark(pNode,ottid){
    const BtnInner = document.createElement("img");
    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        if( mark_watcha.includes(ottid) ){
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
    BtnMark.style.left = "313px";

    BtnMark.style.background = "none";
    BtnMark.style.border = "none"
    BtnMark.style.zIndex = 9999;

    BtnInner.addEventListener('mouseover', watchaContentsOnMouseOverHandler, false);
    BtnInner.addEventListener('mouseout', watchaContentsOnMouseOutHandler, false);
    BtnMark.addEventListener('click', watchaContentsOnClickMarkHandler, false);
    
    BtnMark.appendChild(BtnInner)
    pNode.appendChild(BtnMark)
}

/* @param { PointerEvent } e */
function watchaContentsOnClickMarkHandler(e){
    let l = window.location.pathname
    let ottid = l.split('/').at(-1)

    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        if( mark_watcha.includes(ottid) ){ 
            index = mark_watcha.indexOf(ottid)
            deleteWatchaMarked(index)
            e.target.src = chrome.runtime.getURL("/images/plus-sign.png")
        }else {  
            addWatchaMarked(ottid)
            e.target.src = chrome.runtime.getURL("/images/check.png")
        }
    })
}

/* @param { PointerEvent } e */
function watchaContentsOnMouseOverHandler(e){
    e.target.style.boxShadow = "0 0 0 3px #FFF inset"

    let l = window.location.pathname
    let ottid = l.split('/').at(-1)
        
    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        if (!mark_watcha.includes(ottid)){
            e.target.src = chrome.runtime.getURL("/images/plus-sign2.png")
        }
    })

}
/* @param { PointerEvent } e */
function watchaContentsOnMouseOutHandler(e){
    e.target.style.boxShadow = "none"

    let l = window.location.pathname
    let ottid = l.split('/').at(-1)

    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        if (!mark_watcha.includes(ottid)){
            e.target.src = chrome.runtime.getURL("/images/plus-sign.png")
        }else{
            e.target.src = chrome.runtime.getURL("/images/checkmark.png")
        }
    })

}

// void --> void
function watchaOnContentsRefresh(){
    chrome.storage.sync.get(['mark_watcha'], result => {
        mark_watcha = result['mark_watcha']
        let l = window.location.pathname
        let ottid = l.split('/').at(-1)
        container = document.body.querySelector('section.custom-1gcurak.e1kgye4v2')
        if(container){
            if(mark_watcha.includes(ottid)){
                btnImg = container.querySelector('button.btn-mark > img')
                btnImg.src = chrome.runtime.getURL('images/check.png')
            }else{
                btnImg = container.querySelector('button.btn-mark > img')
                btnImg.src = chrome.runtime.getURL('images/plus-sign.png')
            }
        }
    })
}

