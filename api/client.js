
export class YoutubeClient{
  // Request server for youtube video data  
  // @GET param: { id } 
  // return  res : {... , Array<Object> items}
  constructor() {
    this.urlWithParam = 'http://54.253.190.46:8000/id='
  }
  
  async videos(vids){
    const res = await fetch(this.urlWithParam + vids , {
        method: 'GET',
    }).then(res=>{
        if(res.ok){
            return res.json()
        }else{
            alert('서버 요청 실패')
        }
    })
    .catch(err=>alert('서버 요청 실패'))
    return res
  }
}

export async function updateCache(){
  const client = new YoutubeClient()
  const storage = await chrome.storage.sync.get(['mark_youvid'])
  return client.videos(storage.mark_youvid.toString())
            .then( res => {
              let items = [];
              res.items.map((item)=>{
                items.push({
                  vid : item.id,
                  thumbnails : item.snippet.thumbnails,
                  title : item.snippet.title
                })
              })
              chrome.storage.sync.set({cache:[...items]})
          })
}
