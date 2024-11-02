init();

var state = Object()
state.temp = undefined
state.items = []

//void -> void
function init() {
  document.querySelectorAll('.btn_tab').forEach((e =>{
    e.addEventListener('click', btntabClickEventHandler)
  }))

  chrome.storage.sync.get(
    ['cache', 'mark_netflix_data', 'mark_watcha','mark_watcha_data', 'selectedIndex'], 
    function (result) {

      const containerLists = document.querySelectorAll('li.contents_container')
      containerLists[result['selectedIndex']].style.display = "block"
      const youtubeVideoContainer = document.body.querySelector('.mark_youtube')
      renderYoutubeItems( youtubeVideoContainer , result['cache'], 1 )
      
      const mark_netflix_data = result['mark_netflix_data']
      const netflixVideoContainer = document.body.querySelector('.mark_netflix')
      renderItems( netflixVideoContainer , mark_netflix_data, 2 )

      const mark_watcha_data = result['mark_watcha_data'] 
      const watchaVideoContainer = document.body.querySelector('.mark_watcha')
      renderItems( watchaVideoContainer , mark_watcha_data, 2)
      //console.log(mark_watcha_data)
  })
}


/* @param { PointerEvent } e */
function btntabClickEventHandler(e) {
  const p = e.target.closest("button")
  const index = Array.from(p.parentNode.children).indexOf(p)
  window.scrollTo(0, 0)
  renderTab(index ); // 해당 탭으로 이동
}

/*
  @param { DOM Node } container, 
  @param { Array<YoutubeVideoData> } items, 
  @param { int } numColumn 
*/
function renderYoutubeItems(container, items, numColumn) {
  let count = 0
  for (let item of items){
    if (count % numColumn == 0){
      var row = createDiv('content_row', null)
      row.classList.add('handover')
      row.classList.add('handover_gray')
    }
    
    let title = item.title
    const availableThumbnails = Object.keys(item.thumbnails)
    let thumbnail = item.thumbnails[availableThumbnails[availableThumbnails.length - 1]]

    card = createCard(
                      createImg(thumbnail.url, title, "thumbnail"),                                     
                      createAnchor("https://www.youtube.com/watch?v=" + item.vid, null, onClickCard),
                      title, 
                      item.vid                                                                       
                    )

    row.appendChild(card)
    container.appendChild(row)
    count++
  }

  return container
}

/* 
@param { HTMLElement } container, 
@param { Array<ContentsContainer> } items, 
@param { int } numColumn 
*/
function renderItems(container, items, numColumn) {
  let count = 0
  for (let item of items){
    if (count % numColumn == 0){
      var row = createDiv('content_row', null)
      row.classList.add('handover')
      row.classList.add('handover_gray')
    }
    
    let title = item.title
    let thumbnail = item.imgUrl

    card = createWatchaCard(
                      createImg(thumbnail, title, "thumbnail"),                                     
                      createAnchor(item.watchUrl, null, onClickCard),
                      item.id                                                                       
                    )

    row.appendChild(card)
    container.appendChild(row)
    count++
  }

  return container
}


/* @param {int} index */
function renderTab(index) {
  chrome.storage.sync.set({selectedIndex : index})

  const li = Array.from(document.body.querySelector('.container').children)
  for (let i in li) {
    if (i == index) { li[i].style.display = "block" }
    else { li[i].style.display = "none" }
  }
}

