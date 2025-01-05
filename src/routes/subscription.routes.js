import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelName")
    .get(getUserChannelSubscribers)
    .post(toggleSubscription); // Use channelName instead of channelId

router.route("/u/:subscriberName").get(getSubscribedChannels);

export default router;
