import express from "express";
import * as controller from "./manage.controller.js"
const router = express.Router();

router.get('/admin',controller.manageGet);

router.post('/admin/login',controller.adminLogin);
router.delete('/admin/logout',controller.adminLogout);

router.get('/admin/dashboard',controller.dashboard);

router.get('/admin/monitor/date/:date',controller.monitorDate);
router.get('/admin/monitor/time/:datetime',controller.monitorTime);
router.get('/admin/monitor/ai/:options',controller.monitorAi);
router.get('/admin/monitor/group/:options',controller.showMembers);

router.get('/admin/content/:options',controller.contentsSearch);
router.put('/admin/content',controller.updateRow);

router.get('/admin/user/:userid',controller.userSearch);
router.delete('/admin/user/:userid',controller.userDelete);
router.put('/admin/user',controller.setRecgroup);

router.post('/admin/ott',controller.ottManagePost);

router.post("/admin/jwcontent",controller.crawl);
router.get("/admin/mldata",controller.download);

router.post("/admin/ai",controller.train);
router.delete("/admin/ai",controller.stopTrain);
router.get("/admin/aiprocess",controller.trainProgress);

router.get("/admin/reccontent/:options",controller.getRecommend);
router.post("/admin/reccontent",controller.dispatch);
router.delete("/admin/reccontent",controller.stopDispatch);
router.get("/admin/recprogress",controller.dispatchProgress);

router.get('/admin/errlog/:options',controller.errLogGet);
router.delete('/admin/errlog/:options',controller.errlogDelete);

router.get('/admin/moviecsv/:options',controller.moviecsvGet);
router.post('/admin/moviecsv',controller.moviecsvGet);

router.get('/admin/marked/:options',controller.getMarked);
router.get('/admin/marked/ott/:options',controller.getMarkedOtt);
router.get('/admin/marked/channel/:options',controller.getMarkedChannel);
router.get('/admin/marked/youvid/:options',controller.getMarkedYouvid);
router.get('/admin/marked/streamer/:options',controller.getMarkedStreamer);

export default router;
