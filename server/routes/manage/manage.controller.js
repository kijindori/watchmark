import bcrypt from 'bcrypt';
import { log } from 'console';
import * as db from '../../database/db.js';
import path, {dirname} from 'path';
import { crawlData } from '../../utils/crawl.js';
import fs from "fs";
import { promises as fsPromises } from 'fs';
import axios from 'axios';
import {exec, spawn} from 'node:child_process';
import chokidar from 'chokidar';
import unzipper from "unzipper";
import _ from 'lodash';
import https from 'https';
import psList from 'ps-list';
import env from "dotenv";
env.config();

const __dirname = path.resolve();

let manageGet = async(req,res)=>{
    if(req.session.admin){
        res.status(200).sendFile(path.join(__dirname, 'views/html/main.html'));
    }
    else{
        res.status(400).sendFile(path.join(__dirname, 'views/html/index.html'));
    }
}   

let adminLogin = async (req,res)=>{
    let {adminid,password} = req.body; 
    const timestamp = Date.now();
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    let query = `SELECT adminID, pw FROM admin WHERE adminID= ?`;

    if(req.session.admin){
        res.status(400).json({   
            "content_type" : "json" ,
            "result_code" : 400 ,
            "result_req" : "Already logged in" ,
     })
    }
    else{
        try{
                const dbcheck = await db.getData(query, `${adminid}`)
                if(dbcheck[0] === undefined || dbcheck[0].length === 0){
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "user not found" ,
                        "session" : req.session
                    })
            }
            else{
                const hashCompare = await bcrypt.compare(password, dbcheck[0].pw);
                if(hashCompare){
                    req.session.admin = {
                        isLoggedIn : true,
                        id: dbcheck[0].adminID,
                        password: dbcheck[0].pw,
                    };
                    
                    res.status(200).json({   
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "login success" ,
                        "session" : req.session
                    })
                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "wrong password" ,
                        "session" : req.session
                    })
                }
            }
            }
        catch{
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
    }
};

let adminLogout = async(req, res)=>{
    log("logout", req.session)

        if(req.session.admin){
            req.session.destroy((err) => {
                if (err) {
                    log("세션 삭제시에 에러가 발생했습니다.");
                    return res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "bad request" ,
                 })
                }
                return res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "logout success" ,
                    "session" : req.session
                })
            });
        }else{
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "not logged in" ,
         })
        }

}

let dashboard = async (req,res)=>{
    let query = `select count(contentsID) as number from specification;`;
    let contentsNum = await db.getData(query);
    let disneyNum = await db.getData(`select count(Offers) as number from specification where Offers like '%disney%'`);
    let watchaNum = await db.getData(`select count(Offers) as number from specification where Offers like '%watcha%'`);
    let wavveNum = await db.getData(`select count(Offers) as number from specification where Offers like '%wavve%'`);
    let netflixNum = await db.getData(`select count(Offers) as number from specification where Offers like '%netflix%'`);
    let youtubeNum = await db.getData(`select count(youtubeID) as number from youvid`);
    let youtubechannelNum = await db.getData(`select count(channelID) as number from youtubechannel`);
    let CrawlSuccess = await db.getData(`select count(success) as number from crawlLog where success = 1`);
    let CrawlError= await db.getData(`select count(success) as number from crawlLog where success = 0`);
    contentsNum = String(contentsNum[0].number);
    CrawlSuccess = String(CrawlSuccess[0].number);
    CrawlError = String(CrawlError[0].number);
    disneyNum = String(disneyNum[0].number);
    watchaNum = String(watchaNum[0].number);
    wavveNum = String(wavveNum[0].number);
    netflixNum = String(netflixNum[0].number);
    youtubeNum = String(youtubeNum[0].number)
    youtubechannelNum = String(youtubechannelNum[0].number)
    res.status(200).json({
        "content_type" : "json" ,
        "result_code" : 200 ,
        "result_req" : "request success" ,
        contentsNum, 
        CrawlSuccess, 
        CrawlError,
        disneyNum,
        watchaNum,
        wavveNum,
        netflixNum,
        youtubeNum,
        youtubechannelNum
    })
}

let monitorDate= async (req,res)=>{
    const date = req.params.date;
    let query = `select * from logs where date = ?;`
    let logs = await db.getData(query, date);

    res.status(200).json({
        "content_type" : "json" ,
        "result_code" : 200 ,
        "result_req" : "request success" ,
        "count":logs.length,
        logs
    })
}

let monitorTime = async (req,res)=>{
    const datetime = req.params.datetime;
    let date = datetime.split(".")[0];
    let time = datetime.split(".")[1];

    let query = `select * from logs where date = ? and str_to_date(time,'%H:%i:%s') between ? and ?;`
    let logs = await db.getData(query, [date,`${time}:00:00`,`${(time+1)<25 ?time+1:"01"}:00:00`]);

    res.status(200).json({
        "content_type" : "json" ,
        "result_code" : 200 ,
        "result_req" : "request success" ,
        "count":logs.length,
        logs
    })
}

let contentsSearch = async (req,res)=>{
    const options = req.params.options
    let query = "";
    if(req.session.admin){

        if(options === "selectAll"){
            query = `SELECT * FROM specification`
        }
        else{
            query = `SELECT * FROM specification WHERE rawtitle like ? OR title like ?`
        }
        try{
            db.getData(query,[`%${options}%`,`%${options}%`])
            .then((rows)=>{
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "request success" ,
                    "possible_match": rows,
                })
            });
        }
        catch(err){
            log(err);
            res.status(400).json({
                "content-type": "json",
                "result_code": 400,
                "result_req": "bad request"
            });
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
};

let updateRow = async (req,res)=>{
    const {contentsID, title,rawtitle,jwURL,disneyURL,wavveURL,watchaURL,casts,genre,jwimg,Offers,director,  } = req.body
    let query = `update specification set title = ?,rawtitle=?,jwURL=?,disneyURL=?,wavveURL=?,watchaURL=?,casts=?,genre=?,jwimg=?,Offers=?,director=? where contentsID=?`;
    let values = [title,rawtitle,jwURL,disneyURL,wavveURL,watchaURL,casts,genre,jwimg,Offers,director,contentsID];

    if(req.session.admin){

        try{
            db.updateData(query,values)
            .then(rows=>{
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "update success" ,
                });
            });
        }
        catch{
            res.status(400).json({
                "content-type": "json",
                "result_code": 400,
                "result_req": "bad request"
            });
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
};

let userSearch = async(req,res)=>{
    const userid = req.params.userid;
    let query = ``;
    if(req.session.admin){
        
        try{
            if(userid === "selectAll"){
                query = `SELECT * FROM users`
            }
            else{
                query = `SELECT * FROM users WHERE userID like ?`
            }
            db.getData(query,`%${userid}%`)
            .then(rows=>{
                if(rows.length !== 0){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "possible_match" : rows
                    });
                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no user" ,
                    })
                }
            });
        }
        catch{
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
}

let userDelete = async(req,res)=>{
    const userid = req.params.userid;
    if(req.session.admin){
        let sessionID = await db.getData(`select sessionID from users where userID="${userid}"`);
        
        let query = `delete from users where userID = ?`;
        
        try{
            if(sessionID !== undefined || sessionID.length !== 0){
                for(let i of JSON.parse(sessionID[0].sessionID)){
                    db.updateData(`delete from sessions where session_id = "${i}"`)
                }
            }
            db.updateData(query,`${userid}`)
            .then(rows=>{
                const rowCount = rows.affectedRows
                if(rows.length !== 0 && rowCount>0){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                    });
                }
                else if(rowCount === 0){
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no user" ,
                    })
                }
            });
        }
        catch(err){
            log(err)
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let ottManagePost = async (req,res)=>{
    const { title,rawtitle,jwURL, disneyURL,wavveURL,watchaURL,casts,genre,jwimg,Offers,director,  } = req.body
    let query = `insert into specification (title ,rawtitle,jwURL, disneyURL,wavveURL,watchaURL,casts,genre,jwimg,Offers,director) values(?,?,?,?,?,?,?,?,?,?,?)`;
    let values = [title,rawtitle,disneyURL,jwURL,wavveURL,watchaURL,casts,genre,jwimg,Offers,director];

    if(req.session.admin){
        try{
            db.putData(query,values)
            .then(rows=>{
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "add success" ,
                });
            });
        }
        catch{
            res.status(400).json({
                "content-type": "json",
                "result_code": 400,
                "result_req": "bad request"
            });
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
};

let errLogGet = async (req,res)=>{
    const options = req.params.options;
    let title;
    let query
    if(req.session.admin){

        if(options === "selectAll"){
            query = `SELECT * FROM errLog`
        }
        else {
            title = options;
            query = `SELECT * FROM errLog WHERE title like ?`;
        }
        try{
            db.getData(query,`%${title}%`)
            .then((rows)=>{
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "request success" ,
                    "err_logs": rows,
                })
            });
        }
        catch{
            res.status(400).json({
                "content-type": "json",
                "result_code": 400,
                "result_req": "bad request"
            });
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
};

let errlogDelete = async (req,res)=>{
    const ID = req.params.options;
    if(req.session.admin){
        
        let query = `delete from errLog where ID = ?`;
        
        try{
            db.updateData(query,`${ID}`)
            .then(rows=>{
                const rowCount = rows.affectedRows
                if(rows.length !== 0 && rowCount>0){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "delete success" ,
                    });
                }
                else if(rowCount === 0){
                    res.status(404).json({   
                        "content_type" : "json" ,
                        "result_code" : 404 ,
                        "result_req" : "errLog not found" ,
                    })
                }
            });
        }
        catch(err){
            log(err)
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
};

let moviecsvGet = async (req,res)=>{
    const options = req.params.options;
    let title;
    let query
    if(req.session.admin){

        if(options === "selectAll"){
            query = `SELECT movieID, title, genre, releaseDate FROM moviecsv`
        }
        else {
            title = options;
            query = `SELECT movieID, title, genre, releaseDate FROM moviecsv where title like ?`
        }
        try{
            db.getData(query,`%${title}%`)
            .then((rows)=>{
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "request success" ,
                    "moviecsv": rows,
                })
            });
        }
        catch{
            res.status(400).json({
                "content-type": "json",
                "result_code": 400,
                "result_req": "bad request"
            });
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
};

let crawl = async (req,res)=>{
    const {url} = req.body;
    if(req.session.admin){
        try{
            const crawled = await crawlData(url);
            let genre = crawled.details.split("|")[1].split(":")[1]
            let director = crawled.details.split("|")[4].split(":")[1]
            let disney = "";
            let wavve = "";
            let watcha = "";
            for(let i of crawled.hrefs.split(",")){
                if(i.includes("disney")){
                    disney = i;
                }
                if(i.includes("wavve")){
                    wavve = i;
                }
                if(i.includes("watcha")){
                    watcha = i;
                }
            }
            let query = `insert into specification (title ,rawtitle,summary,casts,jwimg,Offers,jwURL,disneyURL,wavveURL,watchaURL,genre,director) values(?,?,?,?,?,?,?,?,?,?,?,?)`;
            let values = [crawled.title,crawled.rawtitle,crawled.synopsistext,crawled.actors,crawled.imgSrc,crawled.offers,url,disney,wavve,watcha,genre,director]
            db.putData(query,values)
            db.putData(`insert into crawlLog (url,success,errmsg) values(?,?,?)`,[url,true,null]);

            res.status(200).json({
                "content_type" : "json" ,
                "result_code" : 200 ,
                "result_req" : "request success" ,
                "crawled_data": crawled,
            })
            if(crawled[0]){

            }
        }
        catch(err){
            db.putData(`insert into crawlLog (url,success,errmsg) values(?,?,?)`,[url,false,JSON.stringify(err)])
            log(err)
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "Bad Request" ,
            })
        }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let download = async(req,res)=>{
    const downloadUrl = 'https://files.grouplens.org/datasets/movielens/ml-latest-small.zip';
    const downloadFolder = path.join(__dirname, 'downloads');

    if(req.session.admin){
        try {
            // 다운로드 폴더가 없다면 생성
            if (!fs.existsSync(downloadFolder)) {
              fs.mkdirSync(downloadFolder);
            }
            const ml_latest_small = path.join(__dirname,'download','ml_latest_small');
            let directory = fs.existsSync(ml_latest_small);
            if(directory){
                fs.unlinkSync(ml_latest_small);
                log("renewed file")
            }
            // 파일 다운로드
            const response = await axios.get(downloadUrl, {
                responseType: 'stream'
            });
              
    
            await response.data.pipe(unzipper.Extract({ path: downloadFolder })).promise()
            .then(()=>{
                log('파일 압축 해제 성공')
            })
            .catch(err=>{
                log(err);
            })
        
            const preprocessed = path.join(__dirname,'ml-small', 'preprocessed_small.csv');
            directory = fs.existsSync(preprocessed);
            if(directory){
                fs.unlinkSync(preprocessed);
                log("renewed file")
            }

            const cwd = path.join(__dirname,'ml-small')
            // Python 스크립트 실행 (preprocess.py)
            const pythonProcess = exec('python3 preprocess_small.py', { cwd: cwd }, (error, stdout, stderr) => {
                log("Start Preprocess");
              if (error) {
                console.error(`Error: ${error.message}`);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "Error processing the file" ,
                })
                return;
              }
              if (stderr) {
                console.error(`Stderr: ${stderr}`);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "Error processing the file" ,
                })
                return;
              }
        
              console.log(`Python script output: ${stdout}`);
              console.log("File processed successfully")
              
            const moviescsv = fs.readFileSync("downloads/ml-latest-small/movies.csv");
            const links4 = fs.readFileSync("downloads/ml-latest-small/links.csv");
            let movielinks = moviescsv.toString().split('\n');
            let list = links4.toString().split('\n');
            let query = `insert into moviecsv (movieid, title, genre, releaseDate, imdbid, tmdbid) values(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),genre=VALUES(genre),releaseDate=VALUES(releaseDate),imdbid=VALUES(imdbid),tmdbid=VALUES(tmdbid)`
            try{
                for(let i in movielinks){
                    if(movielinks[i].split(',')[0] !== "\r" && movielinks[i].split(',')[0] !== ''){
                        let title = movielinks[i].split(",");
                        let movieID = title.shift();
                        let genre = title.pop().replace(/\n|\r|\s*/g, '');
                        let year = title.join(",").replace(/"/g,'').slice(-5,-1);
                        let imdbid = list[i].split(",")[1];
                        let tmdbid = list[i].split(",")[2].replace(/\n|\r|\s*/g, ''); 
                        title = title.join(",").replace(/"/g,'')
                        genre = genre.split("|").join(",")


                        if(Number(movieID)){
                            db.putData(query,[Number(movieID),title,genre,year,imdbid,tmdbid])
                            .then(rows=>{
                            });
                        }
                    }     
                }
                res.status(200).json({
                    "content-type": "json",
                    "result_code": 200,
                    "result_req": "post done",
                    downloadUrl
                });
            }catch(err){
                log(err);
                res.status(400).json({
                    "content-type": "json",
                    "result_code": 400,
                    "result_req": "bad request"
                });
            }
            });

          } catch (error) {
            console.error('처리 중 오류가 발생했습니다:', error);
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "Error processing the file" ,
            })
          }
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let downloadProgress = async(req,res)=>{
    let io;
    const files = ['ml-small/processhistory.txt','ml-small/ratingshistory.txt']
    if(req.session.admin){
        io = req.io;
        // chokidar를 사용하여 디렉토리와 파일 감시
        const watcher = chokidar.watch(files,{interval:3000});
        watcher.on('change', (filePath) => {
            console.log(`파일 변경 감지: ${filePath}`);
            const fileName = filePath.split('/').pop();
            // 변경된 파일의 내용을 클라이언트에 전송
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    console.error('파일 읽기 오류:', err);
                } else {
                    // 모든 클라이언트에 파일 내용 전송
                    console.log(`변경된 내용: ${data}`);
                    io.emit('fileUpdate', `파일 ${fileName}에서 변경된 내용: ${data}`);
                }
            });
        });

        watcher.on('error', (error) => {
            console.error('파일 감시 중 오류 발생:', error);
        });
        res.status(200).json({
            "content_type": "json",
            "result_code": 200,
            "result_req": "OK",
        });
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let train = async(req,res)=>{
    const movieID = req.body.movieID;
    const out = fs.openSync('./out.log', 'a');
    const err = fs.openSync('./err.log', 'a');
    const pythonPath = path.join(__dirname, "ml-small",'vacs_small.py');
    let file;
    let directory;
    let result = []
    if(req.session.admin){
        async function isProcessRunning(command) {
            const processes = await psList();
            for (const process of processes) {
                if (process.cmd.includes(command)) {
                return true; // 프로세스가 실행 중
                }
            }
            return false; // 프로세스가 실행 중이지 않음
        }

        const pythonProcessCommand = 'python /home/t23202/v1.0/server/ml-small/vacs_small.py';

        isProcessRunning(pythonProcessCommand)
        .then((isRunning) => {
            if (isRunning) {
            console.log('프로세스가 실행 중입니다.');
            exec('pkill -f vacs_small.py', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`Stderr: ${stderr}`);
                    return;
                }
                console.log(`Stopped train process: ${stdout}`);
            });
            } else {
            console.log('프로세스가 실행 중이지 않습니다.');
            }
        })
        .catch((error) => {
            console.error('에러 발생:', error);
        });

        for(let i of movieID){
            let search = await db.getData(`select tmdbid,title from moviecsv where movieid = ?`,i)
            if(search.length !== 0 && search !== undefined){
                let url = `https://api.themoviedb.org/3/movie/${search[0].tmdbid}?language=ko-KR`
                try{
                    await axios({
                        method: 'get',
                        url: url,
                        responseType: 'json',
                        headers:{
                            accept: 'application/json',
                            Authorization: process.env.tmdbkey
                        }
                    }).then(response=>{
                        result.push({
                            tmdbid : search[0].tmdbid,
                            title : search[0].title,
                            poster_path : "https://www.themoviedb.org/t/p/w440_and_h660_face"+response.data.poster_path,
                        })
                    })
                }
                catch(err){
                    log("tmdb search error",err)
                }
                
            }
        }
        file = path.join(__dirname,'ml-small','history.txt');
        directory = fs.existsSync(file);
        if(directory){
            fs.unlinkSync(file);
            log("renewed file")
        }
        file = path.join(__dirname,'ml-small','result.txt');
        directory = fs.existsSync(file);
        if(directory){
            fs.unlinkSync(file);
            log("renewed file")
        }
        res.status(200).json({   
            "content_type" : "json" ,
            "result_code" : 200 ,
            "result_req" : "Training On",
            result
        })
        const pythonProcess = spawn('python', [pythonPath, movieID],{
            detached:true,
            stdio: ['ignore',out,err],
        });

        pythonProcess.unref();

    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let trainProgress = async(req,res)=>{
    let io;
    const files = [
        { fileName: 'history.txt', filePath: 'ml-small/history.txt' },
        { fileName: 'result.txt', filePath: 'ml-small/result.txt' },
    ];
    let result = [];
    let title = [];
    let sims = [];
    let top3;
    if(req.session.admin){
        io = req.io;
        let clientId = socketId;
        
        const watchFile = async (fileName, filePath) => {
            const watcher = chokidar.watch(filePath);
            
            watcher.on('change', async () => {
              try {
                const data = await fsPromises.readFile(filePath, 'utf-8');
                if(filePath === 'ml-small/result.txt'){
                    let tmdbid = data.split("\n")
                    for(let i of tmdbid){
                        if(i !== ""){
                            sims.push(i.split("|")[2].split(",").slice(0,5))
                            let movieid = i.split("|")[0]
                            top3 = i.split("|")[1].split(",").slice(0,5)
                            await db.getData(`select title from moviecsv where movieid = ?`,movieid)
                            .then(k=>{
                                title.push(k[0].title)
                            })
                            for(let p of top3){
                                let search = await db.getData(`select tmdbid,title from moviecsv where movieid = ?`,p)
                                if(search.length !== 0 && search !== undefined){
                                    let url = `https://api.themoviedb.org/3/movie/${search[0].tmdbid}?language=ko-KR`
                                    try{
                                        await axios({
                                            method: 'get',
                                            url: url,
                                            timeout: 60000,
                                            httpAgent: new https.Agent({keepAlive:true}),
                                            responseType: 'json',
                                            headers:{
                                                accept: 'application/json',
                                                Authorization: process.env.tmdbkey
                                            }
                                        }).then(response=>{
                                            result.push({
                                                title : search[0].title,
                                                poster_path : "https://www.themoviedb.org/t/p/w440_and_h660_face"+response.data.poster_path,
                                            })
                                        })
                                    }
                                    catch(err){
                                        log("tmdb search error",err)
                                    }
                                    
                                }

                            }
                        }
                    }
                    io.to(clientId).emit('fileUpdate', `${JSON.stringify(result)}|${title}|${sims}`);
                    log(`파일 ${fileName}에서 변경된 내용: ${data}|${JSON.stringify(result)}`);
                    title = [];
                    result = [];
                    sims = [];
                }else{
                    io.to(clientId).emit('fileUpdate', `파일 ${fileName}에서 변경된 내용: ${data}`);
                    log(`파일 ${fileName}에서 변경된 내용: ${data}`);
                }
                // 클라이언트에 변경된 파일 내용 전송
              } catch (error) {
                console.error(`파일 읽기 오류 (${fileName}):`, error);
              }
            });
          
            watcher.on('error', (error) => {
              console.error(`파일 감시 중 오류 발생 (${fileName}):`, error);
            });
          };

        for (const { fileName, filePath } of files) {
            await watchFile(fileName, filePath);
        }

        res.status(200).json({
            "content_type": "json",
            "result_code": 200,
            "result_req": "OK",
        });
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let dispatch = async(req,res)=>{
    const options = req.body.options;
    const where = req.body.where;
    const pythonPath = path.join(__dirname, "ml-small",'dispatch_small.py');
    let pickle;
    let start;
    const out = fs.openSync('./out.log', 'a');
    const err = fs.openSync('./err.log', 'a');
    if(options === "100"){
        pickle = path.join(__dirname, "ml-small",'encoded_100_small.pickle');
    }
    else if(options === "200"){
        pickle = path.join(__dirname, "ml-small",'encoded_200_small.pickle');
    }
    else if(options === "300"){
        pickle = path.join(__dirname, "ml-small",'encoded_300_small.pickle');
    }
    else if(options === "400"){
        pickle = path.join(__dirname, "ml-small",'encoded_400_small.pickle');
    }
    else if(options === "500"){
        pickle = path.join(__dirname, "ml-small",'encoded_500_small.pickle');
    }
    else if(options === "600"){
        pickle = path.join(__dirname, "ml-small",'encoded_600_small.pickle');
    }
    if(where === "reca"){
        start = await db.getData(`select count(recasims) as number from moviecsv`,);
        
    }
    if(where === "recb"){
        start = await db.getData(`select count(recbsims) as number from moviecsv`,);

    }
    
    start = Number(start[0].number) + 1 ;
    if(req.session.admin){
        res.status(200).json({   
            "content_type" : "json",
            "result_code" : 200,
            "result_req" : "dispatch on process",
        })

        const pythonProcess = spawn('python3', [pythonPath,pickle,start,where],{
            detached: true,
            stdio: ['ignore',out,err],
        })

        pythonProcess.unref();

    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let dispatchProgress = async(req,res)=>{
    let io;
    const files = [
        { fileName: 'dispatchhistory.txt', filePath: 'ml-small/dispatchhistory.txt' },
    ];
    if(req.session.admin){
        io = req.io;
        const watchFile = async (fileName, filePath) => {
            const watcher = chokidar.watch(filePath);
          
            watcher.on('change', async () => {
              try {
                const data = await fsPromises.readFile(filePath, 'utf-8');

                io.emit('fileUpdate', `파일 ${fileName}에서 변경된 내용: ${data}`);
                log(`파일 ${fileName}에서 변경된 내용: ${data}`);
              } catch (error) {
                console.error(`파일 읽기 오류 (${fileName}):`, error);
              }
          
              // 시뮬레이트된 프로세스 진행도를 전송
            });
          
            watcher.on('error', (error) => {
              console.error(`파일 감시 중 오류 발생 (${fileName}):`, error);
            });
          };

        for (const { fileName, filePath } of files) {
            await watchFile(fileName, filePath);
        }
       
       
        res.status(200).json({
            "content_type": "json",
            "result_code": 200,
            "result_req": "OK",
        });
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let stopTrain = async(req,res)=>{
    if(req.session.admin){
        exec('pkill -f vacs_small.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                res.status(400).json({
                    "content_type": "json",
                    "result_code": 400,
                    "result_req": "Error stopping dispatch process",
                });
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                res.status(400).json({
                    "content_type": "json",
                    "result_code": 400,
                    "result_req": "Error stopping dispatch process",
                });
                return;
            }
            console.log(`Stopped dispatch process: ${stdout}`);
            res.status(200).json({
                "content_type": "json",
                "result_code": 200,
                "result_req": "Train process stopped successfully",
            });
        });
    }
    else{
        res.status(401).json({   
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "Unauthorized" ,
        })
    }
}

let stopDispatch = async(req,res)=>{
    if(req.session.admin){
        exec('pkill -f dispatch.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                res.status(400).json({
                    "content_type": "json",
                    "result_code": 400,
                    "result_req": "Error stopping dispatch process",
                });
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                res.status(400).json({
                    "content_type": "json",
                    "result_code": 400,
                    "result_req": "Error stopping dispatch process",
                });
                return;
            }
            console.log(`Stopped dispatch process: ${stdout}`);
            res.status(200).json({
                "content_type": "json",
                "result_code": 200,
                "result_req": "Dispatch process stopped successfully",
            });
        });
    }
    else{
        res.status(401).json({   
            "content_type" : "json",
            "result_code" : 401 ,
            "result_req" : "Unauthorized"
        })
    }
}

//유저가 찜한내용 조회 api
let getMarked = async (req,res)=>{
    const options = req.params.options; //options
    let query1, query2,query3,query4
    if(req.session.admin){
        if(!options){
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        else{
            if(options === "selectAll"){
                query1 = `SELECT * FROM marked_channel;`;
                query2 = `SELECT * FROM marked_youvid;`;
                query3 = `SELECT * FROM marked_ott;`;
                query4 = `SELECT * FROM marked_streamer;`;
                try{
                    
                    let marked = await db.getData(query1+query2+query3+query4)
                    if(marked !== undefined){
                        
                        res.status(200).json({
                            "content_type" : "json" ,
                            "result_code" : 200 ,
                            "result_req" : "request success" ,
                            "result": {
                                "marked_channel":marked[0]?marked[0]:"",
                                "marked_youvid":marked[1]?marked[1]:"",
                                "marked_ott":marked[2]?marked[2]:"",
                                "marked_streamer":marked[3]?marked[3]:""
                            },
                        })
    
                    }
                    else{
                        res.status(400).json({   
                            "content_type" : "json" ,
                            "result_code" : 400 ,
                            "result_req" : "no data" ,
                        })
                    }
                }
                catch(err){
                    log(err);
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "bad request" ,
                    })
                }
            }else{
                query1 = `SELECT * FROM marked_channel WHERE userID = "${options}";`;
                query2 = `SELECT * FROM marked_youvid WHERE userID = "${options}";`;
                query3 = `SELECT * FROM marked_ott WHERE userID = "${options}";`;
                query4 = `SELECT * FROM marked_streamer WHERE userID = "${options}";`;
                try{
                    
                    let marked = await db.getData(query1+query2+query3+query4)
                    if(marked !== undefined){
                        let snippet = []
                        let items = []
                        if(marked[1][0] !== undefined && marked[1][0].length !== 0){
                            for(let i of marked[1][0].vID.split("|")){
                                await db.getData(`SELECT snippet FROM youvid WHERE youtubeID = "${i}";`)
                                .then(p=>{
                                    if(p.length!==0 && p !== undefined){
                                        snippet.push(JSON.parse(decodeURIComponent(p[0].snippet)))
                                    }
                                })
                            }
                            marked[1][0].snippet = snippet
    
                        }
                        if(marked[0][0] !== undefined && marked[0][0].length !== 0){
                            for(let i of marked[0][0].channelID.split("|")){
                                await db.getData(`SELECT items FROM youtubechannel WHERE channelID = "${i}";`)
                                .then(p=>{
                                    if(p.length!==0 && p !== undefined){
                                        items.push(JSON.parse(decodeURIComponent(p[0].items)))
                                    }
                                })
                            }
                            marked[0][0].items = items
                        }
                        
                        res.status(200).json({
                            "content_type" : "json" ,
                            "result_code" : 200 ,
                            "result_req" : "request success" ,
                            "result": {
                                "marked_channel":marked[0][0]?marked[0][0]:"",
                                "marked_youvid":marked[1][0]?marked[1][0]:"",
                                "marked_ott":marked[2][0]?marked[2][0]:"",
                                "marked_streamer":marked[3][0]?marked[3][0]:""
                            },
                        })
    
                    }
                    else{
                        res.status(400).json({   
                            "content_type" : "json" ,
                            "result_code" : 400 ,
                            "result_req" : "no data" ,
                        })
                    }
                }
                catch(err){
                    log(err);
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "bad request" ,
                    })
                }
            }
            
        }
    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};
let getMarkedOtt = async (req,res)=>{
    const options = req.params.options; //userid
    let query;
    if(req.session.admin){
        if(!options){
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        else{
            if(options==="selectAll"){
                query = `SELECT * from marked_ott`;
            }
            else{
                query = `SELECT * from marked_ott where userID like ?;`
            }
            
            try{
                let marked = await db.getData(query, `%${options}%`)
                if(marked !== undefined){
                                        
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "result": marked,
                    })

                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
            }
            catch(err){
                log(err);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "bad request" ,
                })
            }
        }
    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};
let getMarkedChannel = async (req,res)=>{
    const options = req.params.options; //userid
    let query;
    if(req.session.admin){
        if(!options){
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        else{
            if(options==="selectAll"){
                query = `SELECT * from marked_channel`;
            }
            else{
                query = `SELECT * from marked_channel where userID like ?;`
            }
            
            try{
                let marked = await db.getData(query, `%${options}%`)
                if(marked !== undefined){
                                        
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "result": marked,
                    })

                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
            }
            catch(err){
                log(err);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "bad request" ,
                })
            }
        }
    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};
let getMarkedYouvid = async (req,res)=>{
    const options = req.params.options; //userid
    let query;
    if(req.session.admin){
        if(!options){
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        else{
            if(options==="selectAll"){
                query = `SELECT * from marked_youvid`;
            }
            else{
                query = `SELECT * from marked_youvid where userID like ?;`
            }
            
            try{
                let marked = await db.getData(query, `%${options}%`)
                if(marked !== undefined){
                                        
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "result": marked,
                    })

                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
            }
            catch(err){
                log(err);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "bad request" ,
                })
            }
        }
    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};
let getMarkedStreamer = async (req,res)=>{
    const options = req.params.options; //userid
    let query;
    if(req.session.admin){
        if(!options){
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        else{
            if(options==="selectAll"){
                query = `SELECT * from marked_streamer`;
            }
            else{
                query = `SELECT * from marked_streamer where userID like ?;`
            }
            
            try{
                let marked = await db.getData(query, `%${options}%`)
                if(marked !== undefined){
                                        
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "result": marked,
                    })

                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
            }
            catch(err){
                log(err);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "bad request" ,
                })
            }
        }
    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};

let getRecommend = async (req,res)=>{
    const options = req.params.options; //userid
    let query;
    if(req.session.admin){
        if(!options){
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        else{
            if(options==="selectAll"){
                query = `select movieid, title, recA, recB, recC, recasims, recbsims, reccsims from moviecsv`;
            }
            else{
                query = `select movieid, title, recA, recB, recC, recasims, recbsims, reccsims from moviecsv where movieid = ?`
            }
            
            try{
                let moviecsv = await db.getData(query, options)
                if(moviecsv !== undefined){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "result": moviecsv,
                    })
                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
            }
            catch(err){
                log(err);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "bad request" ,
                })
            }
        }
    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};

let setRecgroup = async(req,res)=>{
    const userid = req.body.userid;
    const recgroup = req.body.recgroup;
    const timestamp = Date.now();
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    let query = `update users set recgroup=?, timestamp=? where userID=?`;
    if(req.session.admin){
        if(!userid){
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        else{
            try{
                await db.getData(query, [recgroup,now,userid])
                .then(p=>{
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                    })
                })
            }
            catch(err){
                log(err);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "bad request" ,
                })
            }
        }
    } 
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
}

let monitorAi = async (req,res)=>{
    const options = req.params.options; //userid
    let querya,queryb,queryc,queryAhit, queryAclick, queryBhit,queryBclick, queryChit, queryCclick, counta,countb,countc;
    if(req.session.admin){
        if(options === "selectAll"){
            querya = `select userID, event_type, event_target, recgroup, timestamp from user_behavior where recgroup = "0";`;
            queryb = `select userID, event_type, event_target, recgroup, timestamp from user_behavior where recgroup = "1";`;
            queryc = `select userID, event_type, event_target, recgroup, timestamp from user_behavior where recgroup = "2";`;

            queryAhit = `select count(event_type) as hit, recgroup from user_behavior where recgroup = "0" and event_type="hit";`;
            queryAclick = `select count(event_type) as click, recgroup from user_behavior where recgroup = "0" and event_type="click";`;
            queryBhit = `select count(event_type) as hit, recgroup from user_behavior where recgroup = "1" and event_type="hit";`;
            queryBclick = `select count(event_type) as click, recgroup from user_behavior where recgroup = "1" and event_type="click";`;
            queryChit = `select count(event_type) as hit, recgroup from user_behavior where recgroup = "2" and event_type="hit";`;
            queryCclick = `select count(event_type) as click, recgroup from user_behavior where recgroup = "2" and event_type="click";`;
            
            counta = `select count(recgroup) as num, timestamp from users where recgroup = "0";`;
            countb = `select count(recgroup) as num, timestamp from users where recgroup = "1";`;
            countc = `select count(recgroup) as num, timestamp from users where recgroup = "2";`;
        try{
            let userbehavior = await db.getData(queryAhit+queryAclick+queryBhit+queryBclick+queryChit+queryCclick+querya+queryb+queryc+counta+countb+countc)
            let groupA = (Number(userbehavior[0][0].hit)/Number(userbehavior[1][0].click))*100
            let groupB = (Number(userbehavior[2][0].hit)/Number(userbehavior[3][0].click))*100
            let groupC = (Number(userbehavior[4][0].hit)/Number(userbehavior[5][0].click))*100
            if(userbehavior !== undefined){
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "request success" ,
                    "result": {
                        a:{
                            percentage: groupA+"%",
                            users:userbehavior[9][0].num,
                            changtime:userbehavior[9][0].timestamp,
                            list: userbehavior[6]
                        },
                        b:{
                            percentage: groupB+"%",
                            users:userbehavior[10][0].num,
                            changtime:userbehavior[10][0].timestamp,
                            list: userbehavior[7]
                        },
                        c:{
                            percentage: groupC+"%",
                            users:userbehavior[11][0].num,
                            changtime:userbehavior[11][0].timestamp,
                            list: userbehavior[8]
                        },
                    },
                })
            }
            else{
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "no data" ,
                })
            }
        }
        catch(err){
            log(err);
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        }
        else{
            let query = `select userID, event_type, event_target, recgroup from user_behavior where userID = ?;`;
            await db.getData(query, options)
            .then(p=>{
                if(p.length === 0){
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
                else if(p !== undefined){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "result": p,
                    })
                }
                
            })
            .catch(err=>{
                log(err);
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "bad request" ,
                })
            })
        }
          
        
    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};

let showMembers = async (req,res)=>{
    const options = req.params.options; //userid
    let query;
    if(req.session.admin){
        if(options === "0"){
            query = `select * from users where recgroup="0"`
        }
        else if(options === "1"){
            query = `select * from users where recgroup="1"`
        }
        else if(options === "2"){
            query = `select * from users where recgroup="2"`
        }
        try{
            let members = await db.getData(query)
            if(members !== undefined){
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "request success" ,
                    "members": members
                })
            }
            else{
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "no data" ,
                })
            }
        }
        catch(err){
            log(err);
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        
    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
}

export {
    manageGet,userSearch, userDelete, adminLogin, 
    adminLogout,dashboard,monitorDate,monitorTime, 
    contentsSearch, updateRow, errLogGet,errlogDelete, 
    moviecsvGet, ottManagePost, crawl,download, train, 
    dispatch,stopTrain,stopDispatch, trainProgress,
    downloadProgress,dispatchProgress,getMarked,getMarkedOtt,
    getMarkedChannel,getMarkedStreamer,getMarkedYouvid,getRecommend,
    setRecgroup,monitorAi,showMembers
};