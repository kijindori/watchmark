var state = Object()
state.temp = undefined
state.items = []

function createAnchor ( href, className, clickEventHandler ){
    a = document.createElement('a')
    if(className) { a.className = className }
    a.href = href
    a.addEventListener('click', function(e){
      clickEventHandler(e)
    });
  
    return a
  }
  
function createImg( src , alt, className ){
  img = document.createElement('img')
  img.src = src
  img.alt = alt
  if(className) { img.className = className }

  return img
}

function createDiv(className, id){
  wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  if(className) {wrapper.className = className}
  if(id) {wrapper.dataset.id = id}

  return wrapper
}

function createButton(img, eventHandler, className){
  btn = document.createElement('button')

  if ( img ) {
    btn.appendChild(img)
  }
  
  if ( className ){
    btn.className = className
  }
  
  btn.addEventListener("click", function(e){
    console.log(e)
    eventHandler(e)
  })

  return btn
}

function createCheckBox(){
  img = createImg('images/check_box_black.png', '선택 버튼','btn_check_img')

  btnCheck = createButton(
    img,
    onClickDelete, 
    'btn_check'
  )

  return btnCheck
}


function createSwapButton(){
  img = createImg('images/check_box_black.png', '순서 변환 버튼','btn_swap_img')

  btnSwap = createButton(
    img,
    onClickSwap, 
    'btn_swap'
  )

  return btnSwap
}

function createDeleteButton( eventHandler ){
  img = createImg('images/trashcan.png', '삭제 버튼', 'btn_delete_img')

  btnDelete = createButton(
    img,
    eventHandler, 
    'btn_delete'
  )

  return btnDelete
}

function createCard(img,   //카드 썸네일로 보여질 이미지
                    anchor,//카드 클릭시 페이지 이동을 위한 anchor
                    title, //카드 제목으로 보여질 텍스트
                    id){   //카드에 부여할 아이디

  card = createDiv("card", id)
  //card.setAttribute("draggable", true)

  txt = document.createElement('h3')
  txt.innerText = title

  btnWrapper = createDiv("arrange", null)
  btnDelete = createDeleteButton(onClickDelete)
  btnWrapper.append(btnDelete)

  anchor.append(
    img,
    txt
  )
  card.append(
    anchor,
    btnWrapper
  )

  return card
}

function createWatchaCard(
                    img,   //카드 썸네일로 보여질 이미지
                    anchor,//카드 클릭시 페이지 이동을 위한 anchor
                    id){   //카드에 부여할 아이디

  card = createDiv("card", id)

  btnWrapper = createDiv("arrange", null)
  btnDelete = createDeleteButton(onClickDeleteWatcha)
  btnWrapper.append(btnDelete)

  anchor.append(
    img
  )
  card.append(
    anchor,
    btnWrapper
  )

  return card
}

/* @param { PointerEvent } e */
function onClickCard(e){
  chrome.tabs.create(
    {url: e.target.closest('a').href}
  );
}

/* @param { PointerEvent } e */
function onClickDelete(e){
  chrome.storage.sync.get(['mark_youvid'], function(result){
    parentNode = e.target.closest('.card')
    vid = parentNode.dataset.id
    vidList = result['mark_youvid']

    idx = vidList.indexOf(vid)
    vidList.splice(idx,1)
    state.items.splice(idx,1)

    chrome.storage.sync.set({
      mark_youvid : vidList
    }).then( () =>{
        if(e.target.closest('.content_row').childElementCount == 1){
          e.target.closest('.content_row').remove()
        }else{
          e.target.closest('.card').remove()
        }
      })
  })
}

/* @param { PointerEvent } e */
function onClickDeleteWatcha(e){

  chrome.storage.sync.get(['mark_watcha', 'mark_watcha_data'], function(result){
    parentNode = e.target.closest('.card')
    vid = parentNode.dataset.id
    mark_watcha = result['mark_watcha']
    mark_watcha_data = result['mark_watcha_data']

    idx = mark_watcha.indexOf(vid)
    mark_watcha.splice(idx,1)
    mark_watcha_data.splice(idx, 1)

    chrome.storage.sync.set({
      mark_watcha : mark_watcha,
      mark_watcha_data : mark_watcha_data
    }).then( () =>{
        if(e.target.closest('.content_row').childElementCount == 1){
          e.target.closest('.content_row').remove()
        }else{
          e.target.closest('.card').remove()
        }
      })
  })
}

/* @param { PointerEvent } e */
function onClickSwap(e){
  console.log(state.temp)
  getStorage(['mark_youvid']).then(result=>{

    a = result['mark_youvid']
    pNode = e.target.closest('.card')

    if (state.temp === undefined){
      state.temp = pNode
      e.target.src = 'images/checked_box_black.png'
    }else{
      let idx1 = a.indexOf(pNode.dataset.id)
      let idx2 = a.indexOf(state.temp.dataset.id)

      state.temp.querySelector('.btn_swap > img').src = 'images/check_box_black.png'
      let dummy = document.createElement("span")
      state.temp.before(dummy)
      pNode.before(state.temp)
      dummy.replaceWith(pNode)
      
      state.temp = undefined
      swap(a, idx1, idx2)
      swap(state.items, idx1, idx2)
      chrome.storage.sync.set({mark_youvid : a})
    }
  })
}
