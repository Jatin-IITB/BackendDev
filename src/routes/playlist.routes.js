import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js"; // Import multer middleware for file uploads

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .post(
        upload.single("thumbnail"), // Handle thumbnail upload
        createPlaylist
    );

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(
        upload.single("thumbnail"), // Allow thumbnail updates
        updatePlaylist
    )
    .delete(deletePlaylist);

router
    .route("/:playlistId/videos/:videoId")
    .patch((req, res) => {
        const { action } = req.query; // e.g., ?action=add or ?action=remove
        if (action === "add") return addVideoToPlaylist(req, res);
        if (action === "remove") return removeVideoFromPlaylist(req, res);
        throw new ApiError(400, "Invalid action. Use 'add' or 'remove'.");
    });

router.route("/user/:userId").get(getUserPlaylist);

export default router;
