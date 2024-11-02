import bcrypt from 'bcrypt';
import { log } from 'console';
import * as db from "../database/db.js";
import path from 'path';
import axios from 'axios';
import env from "dotenv";
env.config();
const __dirname = path.resolve();

let mainGet = async(req,res)=>{
    res.sendFile(path.join(__dirname, 'views/html/boot.html'));
}   

let register = async(req,res)=>{
    let {userid,password,email} = req.body; 
    const timestamp = Date.now();
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    let sessionID = []
    const recgroup = Math.floor(Math.random() * 3);
    const insert = `insert into users (userID, password ,email, regiTime, useSet, sessionID, recgroup ,timestamp) values(?,?,?,?,?,?,?,?)`;
    const select = `SELECT userID FROM users WHERE userID= ?`;
    const hashPassword = await bcrypt.hash(password,12);
    const useSet = [{"type" : "ottGroups","setting" : ["최근 추가된 OTT 콘텐츠"]},{"type" : "channelGroups","setting" : ["최근 추가된 채널"]},{"type" : "youvidGroups","setting" : ["최근 추가된 유튜브 영상"]},{"type" : "streamerGroups","setting" : ["최근 추가된 스트리머"]},{"type" : "light-mode","setting" : 1},{"type" : "subscription","setting" : "true,true,true,true,true,true"}];

    if(req.session.user){
        res.status(400).json({   
            "content_type" : "json" ,
            "result_code" : 400 ,
            "result_req" : "already logged in" ,
     })
    }
    else{
        db.getData(select, userid)
        .then(rows=>{
            if(rows.length !== 0){
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "duplicate userID" ,
             })
            }
            else{
                db.putData(insert,[userid,hashPassword,email,now,`${JSON.stringify(useSet)}`,`${JSON.stringify(sessionID)}`,recgroup,now])
                .then(p=>{
                    res.status(200).json({   
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "registered successfully" ,
                    })
                })
            }
        })

    }
}

let loginPost = async (req,res)=>{
    let {userid,password} = req.body; 
    const timestamp = Date.now();
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    let query = `SELECT userID, password, sessionID FROM users WHERE userID = ?`;

    if(req.session.user){
        log(req.session.user)
        res.status(400).json({   
            "content_type" : "json" ,
            "result_code" : 400 ,
            "result_req" : "already logged in" ,
     })
    }

    else{   
        try{
            const dbcheck = await db.getData(query, `${userid}`)
            
            
            if(dbcheck[0] === undefined){
                res.status(400).json({   
                    "content_type" : "json" ,
                    "result_code" : 400 ,
                    "result_req" : "user not found" ,
                })
            }
            else{
                let sessionID = JSON.parse(dbcheck[0].sessionID);

                const hashCompare = await bcrypt.compare(password, dbcheck[0].password);
                if(hashCompare){
                    req.session.user = {
                        isLoggedIn : true,
                        id: dbcheck[0].userID,
                        password: dbcheck[0].password
                    };

                    sessionID.push(req.session.id)
                    db.putData(`update users set sessionID = ? where userID = ?`,[`${JSON.stringify(sessionID)}`,`${userid}`])
                    .then(p=>{
                        log("result",p)
                    })

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
        catch(err){
            log(err);
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
    }
};

let logoutDelete = async(req, res)=>{
    let userid = req.params.userid;
    try{
        if(req.session.user){
            log(userid);
            let sessionID = await db.getData(`select sessionID from users where sessionID like ?`,`%${req.session.id}%`)
            sessionID = JSON.parse(sessionID[0].sessionID);
            sessionID = sessionID.filter(r=>r !== req.session.id)
            log("sessionID",sessionID)
            db.updateData(`update users set sessionID=? where sessionID like ?`,[`${JSON.stringify(sessionID)}`,`%${req.session.id}%`])
            .then(r=>log(r))
            req.session.destroy((err) => {
                if (err) {
                    console.log("세션 삭제시에 에러가 발생했습니다.");
                    return;
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
    catch(err){
        log(err);
        res.status(400).json({   
            "content_type" : "json" ,
            "result_code" : 400 ,
            "result_req" : "Bad Request" ,
        })
    }
}

let userInfoGet = async(req,res)=>{
    const userid = req.params.userid;
    // log(userid);
    let query = `SELECT * FROM users WHERE userID= ?`
    if(req.session.user){
        try{
            db.getData(query,`${userid}`)
            .then(rows=>{
                if(rows !== undefined){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "user_setting" : rows[0]?rows[0].useSet:"none"
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

let userInfoPost = async (req, res) => {
    const userid = req.params.userid;
    const {useSet,email} = req.body;
    let query = ``;
    const timestamp = Date.now()
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    
    if(req.session.user){
        try {
            query = `update users set email = ?, useSet = ?, timestamp = ? where userid = ?`
            let values = [email,`${JSON.stringify(useSet)}`, now ,userid];
            db.putData(query,values)
            .then(p=>{
                if(p !== undefined){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        })
                }
                else{
                    res.status(400).json({
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "No user" ,
                    })
                }
            });
                
                
            
        }catch(err){
            console.log(err);
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
};

let userBehaviorGet = async(req,res)=>{
    const userID = req.params.userid;
    const start = req.params.start;
    let query;
    if(userID === "selectAll"){
        query = `SELECT * FROM user_behavior WHERE and timestamp >= ?`; 
    }
    else{
        query = `SELECT * FROM user_behavior WHERE userID= ? and timestamp >= ?`;
    }
    let values = [userID,start]
    if(req.session.user || req.session.admin){
        try{
            db.getData(query,values)
            .then(rows=>{
                log(rows);
                if(rows !== undefined && rows.length !== 0){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "user_behavior" : rows
                    })
                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
            })
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

let userBehaviorPost = async(req,res)=>{
    const userID = req.params.userid;
    const event_target = req.body.event_target;
    const event_type = req.body.event_type;
    const timestamp = Date.now()
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    let query = `INSERT INTO user_behavior (userID, event_type, event_target, recgroup, timestamp) VALUES(?,?,?,?,?)`
    let group = await db.getData(`select recgroup from users where userID = ?`,userID)
    if(req.session.user || req.session.admin){
        try{
            db.putData(query,[userID,event_type,event_target,group[0].recgroup,now])
            .then((rows)=>{
                log(rows)
                if(rows !== undefined){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                    })
                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "insert failed" ,
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

let markGet = async (req,res)=>{
    const userid = req.params.userid; //userid
    if(req.session.user){
        if(!userid){
            res.status(400).json({   
                "content_type" : "json" ,
                "result_code" : 400 ,
                "result_req" : "bad request" ,
            })
        }
        else{
            let query1 = `SELECT * FROM marked_channel WHERE userID = "${userid}";`;
            let query2 = `SELECT * FROM marked_youvid WHERE userID = "${userid}";`;
            let query3 = `SELECT * FROM marked_ott WHERE userID = "${userid}";`;
            let query4 = `SELECT * FROM marked_streamer WHERE userID = "${userid}";`;
            try{
                let marked = await db.getData(query1+query2+query3+query4)
                log("marked",marked[1][0]);
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
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};

let searchGet = async (req,res)=>{
    const title = req.params.title; //검색어
    let query = `SELECT title,rawtitle,jwURL,jwimg,Offers,disneyURL,wavveURL,watchaURL FROM specification WHERE title like ? or rawtitle like ?`
    if(req.session.user){
        try{
            db.getData(query,[`%${title}%`,`%${title}%`])
            .then((rows)=>{
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "request success" ,
                    "possible_match": rows,
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
            "result_req" : "unauthorized" ,
        })
    }
};

let ottGet = async (req,res)=>{
    const userid = req.params.userid; //userid
    let query = `SELECT * FROM marked_ott WHERE userID= ?`
    if(req.session.user){
        try{
            db.getData(query,`${userid}`)
            .then((rows)=>{
                if(rows !== undefined){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "marked_ott": rows,
                    })
                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
            })
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
};

let ottPost = async (req,res)=>{
    const requserid = req.params.userid; //userid
    const userid = req.body.id; 
    const contentsID = req.body.contentsid;
    // log(req.body)
    
    const ottID = req.body.ottidList;
    const title = req.body.titleList;
    const img = req.body.imgList;
    let url = req.body.urlList;
    const groupSet = req.body.settingList;
    const type = req.body.typeList;
    const timestamp = Date.now();
    const today = new Date(timestamp);
    let selectQuery = ``;
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    let logQuery = ""
    let inputs = [];
    let genreList = [];

    if(req.session.user){

        try{
            
            if(type.length === 0){
                let values = [requserid, `${contentsID}`, `${ottID.join("|")}`, `${title.join("|")}`, `${img.join("|")}`, `${url.join("|")}`, `${groupSet.join("|")}`, `${type.join("|")}`,`${genreList.join("|")}`,now];
                let query = `INSERT INTO marked_ott (userID, contentsID, ottID, title, img, url, groupSet, type, genre ,timestamp) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE contentsID=VALUES(contentsID), ottID=VALUES(ottID), title=VALUES(title), img=VALUES(img), url=VALUES(url), groupSet=VALUES(groupSet),type=VALUES(type), timestamp=VALUES(timestamp), genre=VALUES(genre)`
        
                db.putData(query, values)
            }
            for(let i in type){
                if(type[i] === "Disney Plus"){
                    selectQuery = `SELECT title,disneyURL,Offers from specification where (title = "${title[i]}" or rawtitle = "${title[i]}")`;
                    const genre = await db.getData(`select genre from specification where (title="${title[i]}" or rawtitle = "${title[i]}")`);
                    genreList[i] = genre&&genre.length!==0?genre[0].genre:"null";

                    db.getData(selectQuery)
                        .then(rows=>{
                            if(rows.length == 0){
                                logQuery = `insert into errLog (type,title,message,timestamp) values(?,?,?,?) ON DUPLICATE KEY UPDATE message=VALUES(message), timestamp=VALUES(timestamp)`
                                inputs = ["disney",title[i],"title not found",now];
                                db.putData(logQuery, inputs)
        
                            }else{
                                if(rows[0].disneyURL == null){
                                    logQuery = `insert into errLog (type,title,message,timestamp) values(?,?,?,?) ON DUPLICATE KEY UPDATE message=VALUES(message), timestamp=VALUES(timestamp)`
                                    inputs = ["disney",title[i],"disneyURL not found",now];
                                    db.putData(logQuery, inputs)
        
                                }
                                else{
                                    url[i] = rows[0].disneyURL;
                                    let values = [requserid, `${contentsID}`, `${ottID.join("|")}`, `${title.join("|")}`, `${img.join("|")}`, `${url.join("|")}`, `${groupSet.join("|")}`, `${type.join("|")}`,now , `${genreList.join("|")}`];
        
                                    let query = `INSERT INTO marked_ott (userID, contentsID, ottID, title, img, url, groupSet, type ,timestamp, genre) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE contentsID=VALUES(contentsID), ottID=VALUES(ottID), title=VALUES(title), img=VALUES(img), url=VALUES(url), groupSet=VALUES(groupSet),type=VALUES(type), timestamp=VALUES(timestamp), genre=VALUES(genre)`
        
                                    db.putData(query, values)
                                }
                            }
                        })
                }
                else if(type[i] === "wavve"){
                    selectQuery = `SELECT title, wavveURL, Offers from specification where (title = "${title[i]}" or rawtitle = "${title[i]}")`;
                    const genre = await db.getData(`select genre from specification where (title="${title[i]}" or rawtitle = "${title[i]}")`);
                    genreList[i] = genre&&genre.length!==0?genre[0].genre:"null";

                    db.getData(selectQuery)
                        .then(rows=>{
        
                            if(rows.length == 0){
                                logQuery = `insert into errLog (type,title,message,timestamp) values(?,?,?,?) ON DUPLICATE KEY UPDATE message=VALUES(message), timestamp=VALUES(timestamp)`
                                inputs = ["wavve",title[i],"title not found",now];
                                db.putData(logQuery, inputs)

                            }else{
        
                                if(rows[0].wavveURL == null){
                                    logQuery = `insert into errLog (type,title,message,timestamp) values(?,?,?,?) ON DUPLICATE KEY UPDATE message=VALUES(message), timestamp=VALUES(timestamp)`
                                    inputs = ["wavve",title[i],"wavveURL not found",now];
        
                                    db.putData(logQuery, inputs)
                                }
                                else{
                                    url[i] = rows[0].wavveURL;
                                    let values = [requserid, `${contentsID}`, `${ottID.join("|")}`, `${title.join("|")}`, `${img.join("|")}`, `${url.join("|")}`, `${groupSet.join("|")}`, `${type.join("|")}`,now, `${genreList.join("|")}`];
        
                                    let query = `INSERT INTO marked_ott (userID, contentsID, ottID, title, img, url, groupSet, type ,timestamp,genre) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE contentsID=VALUES(contentsID), ottID=VALUES(ottID), title=VALUES(title), img=VALUES(img), url=VALUES(url), groupSet=VALUES(groupSet),type=VALUES(type), timestamp=VALUES(timestamp), genre=VALUES(genre)`
        
                                    db.putData(query, values)
                                }
                            }
        
                        })
                }
                else if(type[i] === "Watcha"){
                    const exists = await db.getData(`SELECT title from specification where (title = "${title[i]}" or rawtitle = "${title[i]}")`)
                    if(exists.length === 0){
                        logQuery = `insert into errLog (type,title,message,timestamp) values(?,?,?,?) ON DUPLICATE KEY UPDATE message=VALUES(message), timestamp=VALUES(timestamp)`
                        inputs = ["watcha",title[i],"contents not found",now];
                        db.putData(logQuery, inputs)
                    }
                    selectQuery = `SELECT title, watchaURL, Offers from specification where watchaURL like "%${ottID[i]}%"`;
                    const genre = await db.getData(`select genre from specification where watchaURL like "%${ottID[i]}%"`);
                    genreList[i] = genre&&genre.length!==0?genre[0].genre:"null";
                    let values = [requserid, `${contentsID}`, `${ottID.join("|")}`, `${title.join("|")}`, `${img.join("|")}`, `${url.join("|")}`, `${groupSet.join("|")}`, `${type.join("|")}`,now, `${genreList.join("|")}`];

                    db.getData(selectQuery)
                        .then(rows=>{
                            if(rows !== undefined && rows.length !== 0){
                                title[i] = rows[0].title;
                                values = [requserid, `${contentsID}`, `${ottID.join("|")}`, `${title.join("|")}`, `${img.join("|")}`, `${url.join("|")}`, `${groupSet.join("|")}`, `${type.join("|")}`,now, `${genreList.join("|")}`];
                
                            }
                            else{
                                let query = `INSERT INTO marked_ott (userID, contentsID, ottID, title, img, url, groupSet, type ,timestamp, genre) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE contentsID=VALUES(contentsID), ottID=VALUES(ottID), title=VALUES(title), img=VALUES(img), url=VALUES(url), groupSet=VALUES(groupSet),type=VALUES(type), timestamp=VALUES(timestamp), genre = VALUES(genre)`
                
                                db.putData(query, values)
                            }
                        })
                }
                else{
                    const exists = await db.getData(`SELECT title from specification where (title = "${title[i]}" or rawtitle = "${title[i]}")`)
                    if(exists.length === 0){
                        logQuery = `insert into errLog (type,title,message,timestamp) values(?,?,?,?) ON DUPLICATE KEY UPDATE message=VALUES(message), timestamp=VALUES(timestamp)`
                        inputs = ["netflix",title[i],"contents not found",now];
                        db.putData(logQuery, inputs)
                    }
                    const genre = await db.getData(`select genre from specification where (title="${title[i]}" or rawtitle = "${title[i]}")`);
                    genreList[i] = genre&&genre.length!==0?genre[0].genre:"null";
                    let values = [requserid, `${contentsID}`, `${ottID.join("|")}`, `${title.join("|")}`, `${img.join("|")}`, `${url.join("|")}`, `${groupSet.join("|")}`, `${type.join("|")}`,now, `${genreList.join("|")}`];
                    
                    let query = `INSERT INTO marked_ott (userID, contentsID, ottID, title, img, url, groupSet, type ,timestamp, genre) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE contentsID=VALUES(contentsID), ottID=VALUES(ottID), title=VALUES(title), img=VALUES(img), url=VALUES(url), groupSet=VALUES(groupSet),type=VALUES(type), timestamp=VALUES(timestamp), genre = VALUES(genre)`
            
                    db.putData(query, values)
                }
        }
            
            res.status(200).json({
                "content-type": "json",
                "result_code": 200,
                "result_req": "post done"
            });
        
        }
        catch(err){
            res.status(400).json({
                "content-type": "json",
                "result_code": 400,
                "result_req": err
            });
            log(err)
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

let youvidGet = async (req,res)=>{
    const userid = req.params.userid; //userid
    let query = `SELECT * FROM marked_youvid WHERE userID= ?`
    if(req.session.user){
        try{
            let result = []
            let marked = await db.getData(query,`${userid}`) ;
            log("marked",marked);
            if(marked.length !== 0 && marked[0].vID !== ""){
                let youvidID = marked[0].vID.split("|");
                for(let i of youvidID){
                    let youvid = await db.getData(`select youtubeID, snippet from youvid where youtubeID = ?`,i)
                    if(youvid.length !== 0){
                        result.push(
                            {
                                "youtubeID":youvid[0].youtubeID,
                                "snippet": JSON.parse(decodeURIComponent(youvid[0].snippet))
                            }
                        )
                    }
                    else{
                        let url = `https://www.googleapis.com/youtube/v3/videos?fields=items(id,snippet(title,tags,thumbnails,publishedAt))&part=snippet&key=${process.env.youtubekey}&id=${i}`
                        await axios({
                            method: 'get',
                            url: url,
                            responseType: 'json',
                            }).then(p=>{
                                result.push(
                                    {
                                        "youtubeID":p[0].youtubeID,
                                        "snippet": JSON.parse(p[0].snippet)
                                    }
                                )
                        })
                    }
                }
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "request success" ,
                    "marked_youvid": result,
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
            "result_req" : "unauthorized" ,
        })
    }
};

let youvidPost = async (req,res)=>{
    log(req.body)
    const requserid = req.params.userid; //userid
    const vID = req.body.vidList;
    const groupSet = req.body.settingList;
    const timestamp = Date.now()
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

    let query = `INSERT INTO marked_youvid (userID,vID,groupSet,timestamp) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE vID=VALUES(vID), groupSet=VALUES(groupSet), timestamp=VALUES(timestamp)`
    //구분 용이하게 하기위해 |로 join
    let values = [requserid, `${vID.join("|")}`, `${groupSet.join("|")}`, now];
    if(req.session.user){
        try{
            for(let i of vID){
                db.getData(`select * from youvid where youtubeID = ?`,i).then(p=>{
                    if(p.length === 0){
                        let url = `https://www.googleapis.com/youtube/v3/videos?fields=items(id,snippet(title,tags,thumbnails,publishedAt))&part=snippet&key=${process.env.youtubekey}&id=${i}`
                        axios({
                            method: 'get',
                            url: url,
                            responseType: 'json',
                            }).then(p=>{
                                db.putData(`insert into youvid (youtubeID, snippet) values (?,?) ON DUPLICATE KEY UPDATE snippet=VALUES(snippet)`,[p.data.items[0].id,encodeURIComponent(JSON.stringify(p.data.items[0].snippet))])
                        })
                    }
                    else{
                    }
                })  
            }
            db.putData(query, values)
            .then(rows=>{
                if(rows === undefined){
                    res.status(400).json({
                        "content-type": "json",
                        "result_code": 400,
                        "result_req": "bad request"
                    });
                }
                else{
                    res.status(200).json({
                        "content-type": "json",
                        "result_code": 200,
                        "result_req": "post done"
                    });
                }
            }); 
        }
        catch(err){
            log(err)
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
            "result_req" : "unauthorized" ,
        })
    }

};

let streamerGet = async (req,res)=>{
    const userid = req.params.userid; //userid
    let query = `SELECT * FROM marked_streamer WHERE userID= ?`

    if(req.session.user){
        try{
            db.getData(query,`${userid}`)
            .then((rows)=>{
                if(rows !== undefined){
                    res.status(200).json({
                        "content_type" : "json" ,
                        "result_code" : 200 ,
                        "result_req" : "request success" ,
                        "marked_streamer": rows,
                    })
                }
                else{
                    res.status(400).json({   
                        "content_type" : "json" ,
                        "result_code" : 400 ,
                        "result_req" : "no data" ,
                    })
                }
            })
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
};

let streamerPost = async (req,res)=>{
    const requserid = req.params.userid; //userid
    const userid = req.params.userid; //

    const streamerID = req.body.idList;
    const groupSet = req.body.settingList;
    const title = req.body.titleList;
    const timestamp = Date.now()
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

    let query = `INSERT INTO marked_streamer (userID,streamerID,groupSet,title,timestamp) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE streamerID=VALUES(streamerID), groupSet=VALUES(groupSet),title=VALUES(title), timestamp=VALUES(timestamp)`
    let values = [requserid, `${streamerID.join("|")}`, `${groupSet.join("|")}`,`${title.join("|")}`, now];

    if(req.session.user){
        db.putData(query, values)
        .then(rows=>{
            if(rows === undefined){
                res.status(400).json({
                    "content-type": "json",
                    "result_code": 400,
                    "result_req": "bad request"
                });
            }else{
                res.status(200).json({
                    "content-type": "json",
                    "result_code": 200,
                    "result_req": "post done"
                });
            }
            
        }); 

    }
    else{
        res.status(401).json({
            "content_type" : "json" ,
            "result_code" : 401 ,
            "result_req" : "unauthorized" ,
        })
    }
};

let channelGet = async (req,res)=>{
    const userid = req.params.userid; //userid
    let query = `SELECT * FROM marked_channel WHERE userID= ?`

    if(req.session.user){
        try{
            let result = []
            let marked = await db.getData(query,`${userid}`);
            if(marked.length !== 0 && marked[0].channelID !== ""){
                let channelID = marked[0].channelID.split("|");
                for(let i of channelID){
                    let youtubechannel = await db.getData(`select channelID, items from youtubechannel where channelID = ?`,i)
                    if(youtubechannel.length !== 0){
                        log("exists")
                        result.push(
                            {
                                "channelID":youtubechannel[0].channelID,
                                "items": JSON.parse(decodeURIComponent(youtubechannel[0].items))
                            }
                        )
                    }
                    else{
                        let url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&order=date&type=video&key=${process.env.youtubekey}&channelId=${i}`
                        await axios({
                            method: 'get',
                            url: url,
                            responseType: 'json',
                            }).then(p=>{
                                result.push(
                                    {
                                        "channelID":p[0].channelID,
                                        "items": JSON.parse(p[0].items)
                                    }
                                )
                        })
                    }
                }
                res.status(200).json({
                    "content_type" : "json" ,
                    "result_code" : 200 ,
                    "result_req" : "request success" ,
                    "marked_youvid": result,
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
            "result_req" : "unauthorized" ,
        })
    }
};

let channelPost = async (req,res)=>{
    log(req.body)
    const requserid = req.params.userid; //userid
    const channelID = req.body.cidList;
    const img = req.body.imgList;
    const title = req.body.cnameList;
    const groupSet = req.body.settingList;
    const timestamp = Date.now()
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

    let query = `INSERT INTO marked_channel (userID,channelID,title,img,groupSet,timestamp) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE channelID=VALUES(channelID), groupSet=VALUES(groupSet), timestamp=VALUES(timestamp), title=VALUES(title), img=VALUES(img)`
    let values = [requserid, `${channelID.join("|")}`, `${title.join("|")}`,`${img.join("|")}`,`${groupSet.join("|")}`, now];
    log("values",values);
    if(req.session.user){
            try{
                log(channelID);
                for(let i of channelID){
                    db.getData(`select * from youtubechannel where channelID = ?`,i)
                    .then(p=>{
                        if(p.length === 0){
                            let url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&order=date&type=video&key=${process.env.youtubekey}&channelId=${i}`
                            axios({
                                method: 'get',
                                url: url,
                                responseType: 'json',
                            }).then(p=>{
                                log("api results:",p.data.items);
                                db.putData(`insert into youtubechannel (channelID, items, timestamp) values (?,?,?)`,[i,encodeURIComponent(JSON.stringify(p.data.items)),now])
                                .then(k=>{
                                    log(k);
                                })
                                .catch(err=>{
                                    log("dberr",err)
                                })
                            }).catch(err=>{
                                log(err);
                            })
                        }
                        else{
                        }                    
                    })
                }
                db.putData(query, values)
                .then(rows=>{
                    if(rows === undefined){
                        res.status(400).json({
                            "content-type": "json",
                            "result_code": 400,
                            "result_req": "bad request"
                        });
                    }
                    else{
                        res.status(200).json({
                            "content-type": "json",
                            "result_code": 200,
                            "result_req": "post done"
                        });
                    }
                });  
            }
            catch(err){
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
            "result_req" : "unauthorized" ,
        })
    }
};

let recommend = async (req,res)=>{
    log(req.body);
    let userid = req.body.userid;
    let title = req.body.title;
    let platform = req.body.platform;
    const timestamp = Date.now()
    const today = new Date(timestamp);
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let now = `${year}-${month}-${day} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    let specSearch = await db.getData(`select rawtitle from specification where (title like ? or rawtitle like ?) and Offers like ?`,[`%${title}%`,`%${title}%`,`%${platform}%`])
    let type;
    let rectmdbid;
    let recsims;
    let recgroup = await db.getData(`select recgroup from users where userID = ?`,userid);
    // log("recgroup",recgroup[0].recgroup)
    if(req.session.user){
        let url = `https://api.themoviedb.org/3/search/multi?query=${title}&include_adult=false&language=ko-KR&page=1`
        try{
            type = await axios({
                method: 'get',
                url: url,
                responseType: 'json',
                headers:{
                    accept: 'application/json',
                    Authorization: process.env.tmdbkey
                  }
            })
        }
        catch(err){
            log("type search error",err)
        }

        // log("type",type.data.results[0].media_type)
        // log("specSearch",specSearch)
        if(type.data.results[0].media_type === "movie"){
            if(specSearch !== undefined && specSearch.length !== 0 && specSearch[0].rawtitle !== "None" ){
                let queryTitle = specSearch.map(x=>x.rawtitle)
                if(queryTitle[0].includes("The ")){
                    queryTitle = queryTitle[0].slice(4)
                }
                else if(queryTitle[0].includes("A ")){
                    queryTitle = queryTitle[0].slice(2)
                }
                else{
                    queryTitle = queryTitle[0]
                }
                // log("queryTitle:",queryTitle)
                let moviecsvSearch = await db.getData(`select title, tmdbid, recc,reca,recb, recCsims,recAsims,recBsims from moviecsv where title like ?`,`%${queryTitle}%`)
                if(moviecsvSearch.length === 0){
                    let url = `https://api.themoviedb.org/3/search/movie?query=${queryTitle}&include_adult=false&language=en-US&page=1`
                    try{
                        let movieid = await axios({
                            method: 'get',
                            url: url,
                            responseType: 'json',
                            headers:{
                                accept: 'application/json',
                                Authorization: process.env.tmdbkey
                              }
                        })
                        movieid = movieid.data.results[0].id
                        let recurl = `https://api.themoviedb.org/3/movie/${movieid}/recommendations?language=ko-KR&page=1`
                        try{
                            let recommendation = await axios({
                                method: 'get',
                                url: recurl,
                                responseType: 'json',
                                headers:{
                                    accept: 'application/json',
                                    Authorization: process.env.tmdbkey
                                }
                            })
                            res.status(200).json({
                                "content-type": "json",
                                "result_code": 200,
                                "recommendation" :recommendation.data.results
                            });
                        }
                        catch(err){
                            res.status(404).json({
                                "content-type": "json",
                                "result_code": 404,
                                "result_req": "no recommendations"
                            });
                            log(err)
                        }
                    }
                    catch(err){
                        log(err);
                    }
                }
                else{
                    // log("moviecsvSearch",(moviecsvSearch[0]));
                    if(recgroup[0].recgroup === "0"){
                        rectmdbid = moviecsvSearch[0].reca.split(",");
                        recsims = moviecsvSearch[0].recAsims;
                    }
                    else if(recgroup[0].recgroup === "1"){
                        rectmdbid = moviecsvSearch[0].recb.split(",");
                        recsims = moviecsvSearch[0].recBsims;
                    }
                    else if(recgroup[0].recgroup === "2"){
                        rectmdbid = moviecsvSearch[0].recc.split(",");
                        recsims = moviecsvSearch[0].recCsims;
                    }

                    // log("rectmdbid",rectmdbid);
                    if(rectmdbid.length > 15){
                        rectmdbid = rectmdbid.slice(0,16)
                        // log("rectmdbid",rectmdbid);
                    }
                    
                    let responselist = []
                    recsims = recsims.split(",");
                    for(let i in rectmdbid){
                        let tmdbid = await db.getData(`select tmdbid from moviecsv where movieid = ${rectmdbid[i]}`)
    
                        let url = `https://api.themoviedb.org/3/movie/${tmdbid[0].tmdbid}?language=ko-KR`
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
                                responselist.push({
                                    movieid: rectmdbid[i],
                                    id: response.data.id,
                                    imdb_id : response.data.imdb_id,
                                    original_title : response.data.original_title,
                                    title : response.data.title,
                                    release_date : response.data.release_date,
                                    poster_path : response.data.poster_path,
                                    belongs_to_collection : response.data.belongs_to_collection,
                                    similarity : recsims[i],
                                })
                            })
                            
                        }
                        catch(err){
                            log(err);
                            await db.putData(`insert into errLog (type, title, message, timestamp) values(?,?,?,?)  ON DUPLICATE KEY UPDATE message=VALUES(message), timestamp=VALUES(timestamp)`,["tmdbid",`movieid:${rectmdbid[i]}`,"tmdbid not found",now])
                            log(err.config.url);
                        }
                    }
                    for(let k of responselist){
                        if(k.belongs_to_collection !== null){
                            let url = `https://api.themoviedb.org/3/collection/${k.belongs_to_collection.id}?language=ko-KR`
                        try{
                            const collection = await axios({
                                method: 'get',
                                url: url,
                                responseType: 'json',
                                headers:{
                                    accept: 'application/json',
                                    Authorization: process.env.tmdbkey
                                  }
                            })
                            k.belongs_to_collection = collection.data
                        }
                        catch(err){
                            log(err.config.url)
                        }
                        }
                    }
                    res.status(200).json({
                        "content-type": "json",
                        "result_code": 200,
                        "recommendation": responselist,
                        recsims
    
                    });
                }
            }
            else{
                let url = `https://api.themoviedb.org/3/search/movie?query=${title}&include_adult=false&language=en-US&page=1`
                    try{
                        let movieid = await axios({
                            method: 'get',
                            url: url,
                            responseType: 'json',
                            headers:{
                                accept: 'application/json',
                                Authorization: process.env.tmdbkey
                              }
                        })
                        movieid = movieid.data.results[0].id
                        let recurl = `https://api.themoviedb.org/3/movie/${movieid}/recommendations?language=ko-KR&page=1`
                        try{
                            let recommendation = await axios({
                                method: 'get',
                                url: recurl,
                                responseType: 'json',
                                headers:{
                                    accept: 'application/json',
                                    Authorization: process.env.tmdbkey
                                }
                            })
        
                            res.status(200).json({
                                "content-type": "json",
                                "result_code": 200,
                                "recommendation" :recommendation.data.results
                            });
                        }
                        catch(err){
                            res.status(404).json({
                                "content-type": "json",
                                "result_code": 404,
                                "result_req": "no recommendations"
                            });
                        }
                    }
                    catch(err){
                        log(err);
                        res.status(404).json({
                            "content-type": "json",
                            "result_code": 404,
                            "result_req": "movie notfound"
                        });
                    }
            }
        }
        else if(type.data.results[0].media_type === "tv"){

            let url = `https://api.themoviedb.org/3/tv/${type.data.results[0].id}/recommendations?language=ko-KR&page=1`
            try{
                let recommendation = await axios({
                    method: 'get',
                    url: url,
                    responseType: 'json',
                    headers:{
                        accept: 'application/json',
                        Authorization: process.env.tmdbkey
                    }
                })

                res.status(200).json({
                    "content-type": "json",
                    "result_code": 200,
                    "recommendation" :recommendation.data.results
                });
            }
            catch(err){
                res.status(404).json({
                    "content-type": "json",
                    "result_code": 404,
                    "result_req": "no recommendations"
                });
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



export {mainGet,register,loginPost,userBehaviorGet,
    logoutDelete,userInfoGet,userInfoPost,markGet,
    youvidGet,youvidPost,ottGet,ottPost,
    channelGet,channelPost,streamerGet,
    streamerPost,searchGet,userBehaviorPost,recommend}