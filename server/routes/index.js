import express from "express";
const router = express.Router();
import * as controller from "./main.controller.js"
import * as store from '../database/store.js'

router.get('/',controller.mainGet);

router.post('/register',controller.register);
router.post('/login',controller.loginPost);

router.delete('/logout/:userid',controller.logoutDelete);

router.post('/jwcontents',store.store);
router.post('/jwlinks',store.jwlinks);
router.post('/jwimg',store.jwimg);
router.post('/platlinks',store.platlinks);
router.post('/moviecsv',store.moviecsv);

router.get('/userinfo/:userid',controller.userInfoGet);
router.post('/userinfo/:userid',controller.userInfoPost);

router.get('/userinfo/userbehavior/:userid/:start',controller.userBehaviorGet);
router.post('/userinfo/userbehavior/:userid',controller.userBehaviorPost);

router.get('/mark/:userid',controller.markGet);

router.get('/search/:title',controller.searchGet);

router.get('/mark/ott/:userid',controller.ottGet);
router.post('/mark/ott/:userid',controller.ottPost);

router.get('/mark/youvid/:userid',controller.youvidGet);
router.post('/mark/youvid/:userid',controller.youvidPost);

router.get('/mark/streamer/:userid',controller.streamerGet);
router.post('/mark/streamer/:userid',controller.streamerPost);

router.get('/mark/channel/:userid',controller.channelGet);
router.post('/mark/channel/:userid',controller.channelPost);

router.post('/recommend',controller.recommend);

export default router;
