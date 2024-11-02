import requests
import re
import urllib.request
from bs4 import BeautifulSoup as bs
import time
done = {}
num_done = 50
#
with open('crawled.txt', 'r') as f:
    for i,line in enumerate(f):
        if i < num_done:
            line = line.split(',')
            done[line[1]] = int(line[0])
num_done += 1

#플랫폼별 JW_URL 리스트 파일 오픈
with open('hrefs.txt', 'r') as fr:
    #각 라인별로 처리
    for url in fr:
        url = re.sub('^[\d]+,','', url)
        print(url)
        #처리된 URL 리스트에 있는지 확인
        #있다면 continue
        if url in done: 
            continue
        #없다면
        else:
            time.sleep(1.5)
            # html request
            html = requests.get(url.strip())
            soup = bs(html.text, 'html.parser')

            # html selection 
            # Title(KOR) , rawTitle
            titlebox = soup.select_one('.title-block')
            if titlebox:
                title = titlebox.select_one('h1').text.strip()
                rawtitle = titlebox.select_one('h3')
                if rawtitle : 
                    rawtitle = rawtitle.text
                    if "원제: " in rawtitle:
                        rawtitle = rawtitle.replace("원제: ", '')
                        rawtitle = rawtitle.strip()
            
            #details
            #장르 #재생시간 #PD_Country #감독 #평점 #연령 등급 
            specifics = soup.select('.detail-infos')
            if specifics:
                cutoff = len(specifics) // 2
                specifics = specifics[:-cutoff]
                details = []
                for spec in specifics:
                    t = spec.select_one('h3').text
                    c = spec.select_one('.detail-infos__value').text
                    c = c.strip()
                    c = c.replace(', ',',')
                    details.append(f'{t}:{c}')
            details = '|'.join(details)

            #synpsistext
            #시놉시스
            synopsisbox = soup.select_one('p.text-wrap-pre-line.mt-0')

            if synopsisbox and synopsisbox.select_one('span'):
                synopsistext = synopsisbox.select_one('span').text
                synopsistext = re.sub('[\r]?\n','', synopsistext)       
            else :
                synopsistext = ''
            #actors        
            #출연진
            creditsActors = soup.select('.title-credits__actor')
            actors = []
            if creditsActors:
                for actor in creditsActors:
                    if actor.select_one('span.title-credit-name'):
                        name = actor.select_one('span.title-credit-name').text
                        name = name.strip()
                        actors.append(name)
                actors = ','.join(actors)

            #offers
            offerLinks = soup.select('a.offer')
            if offerLinks:
                offers = []
                hrefs = []
                for o in offerLinks:
                    platform = o.select_one('img.offer__icon').attrs['alt']
                    h = o.attrs['href']
                    if platform not in offers: 
                        offers.append(platform)
                        hrefs.append(f'{title}, {rawtitle}, {platform}, {h}')
                offers = ','.join(offers)
                hrefs = '\n'.join(hrefs)

                #line = [title, str(rawtitle), details, synopsistext, str(actors), offers]
                line = [title, str(rawtitle), details, str(actors), offers]
                line = '|'.join(line)
                with open('jw_contents.txt', 'a', encoding= 'utf-8') as ca:
                    ca.write(str(num_done)+','+line+'\n')
                with open('jw_contents_links.txt', 'a',encoding= 'utf-8') as la:
                    la.write(hrefs+'\n')
            
            #URL DONE 처리
            with open('crawled.txt', 'a') as finished:
                finished.write(str(num_done)+','+url)
            done[url] = num_done
            num_done += 1
    