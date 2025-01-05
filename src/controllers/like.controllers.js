import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, "Unauthorized");
    }
    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });
    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Video Unliked Successfully"));
    } else {
        const newLike = await Like.create({ video: videoId, likedBy: userId });
        return res.status(201).json(new ApiResponse(201, null, "Video Liked Successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, "Unauthorized");
    }
    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });
    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Comment Unliked Successfully"));
    } else {
        const newLike = await Like.create({ comment: commentId, likedBy: userId });
        return res.status(201).json(new ApiResponse(201, null, "Comment Liked Successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, "Unauthorized");
    }
    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });
    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Tweet Unliked Successfully"));
    } else {
        const newLike = await Like.create({ tweet: tweetId, likedBy: userId });
        return res.status(201).json(new ApiResponse(201, null, "Tweet Liked Successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const { page = 1, limit = 10 } = req.query;
    const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } })
        .populate("video", "title description thumbnailUrl createdAt")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

    if (!likedVideos.length) {
        throw new ApiError(404, "No liked videos found");
    }

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
};
