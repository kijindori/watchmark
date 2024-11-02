'''
MovieLens 에서 제공해주는 데이터 중에서
ratings.csv, movies.csv 를 전처리 합니다.

전처리 결과

    [파일이름]                                       [형식]
[preprocessed.csv]                {movieid}|{title}|{released_year}|{genre_vector}
[mean_centered_ratings.csv]          (movieId:rating) ...
'''
import os
import time
import datetime

current_directory = os.getcwd()
file_path = os.path.join(current_directory, 'ml-latest-small/movies.csv')
file_path_ratings = os.path.join(current_directory, 'ml-latest-small/ratings.csv')

def fappendline(filename, string):
    with open(filename, 'a') as f:
        f.write(string+'\n')

def createGvector(s):
    genres = ["Action","Adventure" ,"Animation" ,"Children\'s" ,"Comedy","Crime","Documentary","Drama","Fantasy","Film-Noir","Horror","Musical","Mystery","Romance","Sci-Fi","Thriller","War","Western"]
    s = s.split('|')
    gvector= ['0'] * len(genres)
    for g in s:
        if g in genres:
            gvector[genres.index(g)] = "1"
    return gvector


with open(file_path, 'r', encoding = 'utf-8') as m :
    m.readline() # 헤더 읽기
    for line in m:
        line = line.strip()
        line = line.split(',')
        movieid = int(line[0])
        genres = line[-1]
        gvector = createGvector(genres)
        gvector = ''.join(gvector)

        line = line[1:-1]
        line = ','.join(line)
        line = line.replace('\"','')
        if ", The" in line:
            line = line.replace(', The',"")
            line = "The "+line
        year = line[-5:-1]
        if (')' in year ):
            year = line[-6:-2]
        title = line[:-7]
        ut = time.time()
        dt = datetime.datetime.fromtimestamp( ut ).strftime('%Y-%m-%d %H:%M:%S')
        # fappendline('processhistory.txt', f'{movieid}|{title}|{year}|{gvector},{dt}\n')
        with open('preprocessed_small.csv', 'a', encoding='utf-8') as w:
            w.write(f'{movieid}|{title}|{year}|{gvector}\n')

with open(file_path_ratings, 'r') as r :
    ratings = {}
    r.readline() # 헤더 읽기
    
    for line in r:
        line = line.strip()
        if line:
            fields = line.split(',')
            if len(fields) >= 3:
                userId = fields[0]
                movieId = fields[1]
                rating = fields[2]
                #timestamp = line[3]
                ut = time.time()
                dt = datetime.datetime.fromtimestamp( ut ).strftime('%Y-%m-%d %H:%M:%S')
                # fappendline('ratingshistory.txt', f'{[movieId]}|{rating},{dt}\n')
                if userId in ratings:  
                    ratings[userId].append([movieId, rating])
                else : 
                    ratings[userId] = []
                    ratings[userId].append([movieId, rating])
            else:
                print(f"Skipping line: {line} (insufficient fields)")
        else:
            print("Skipping empty line")

with open('mean_centered_ratings_small.csv', 'w') as note:
    for key in ratings:
        sum = 0
        for r in ratings[key]:
            sum += float(r[1])
        avg = sum / len(ratings[key])
        for i, r in enumerate(ratings[key]):
            r[1] = str(round(float(r[1]) - avg,3))
            ratings[key][i] = r[0] + ":" + r[1]
        l = ','.join(ratings[key])
        note.write(l+'\n')
    