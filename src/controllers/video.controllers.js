import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const validateObjectId = (id, errorMessage) => {
    if (!isValidObjectId(id)) {
        throw new ApiError(400, errorMessage);
    }
};

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const sortOrder = sortType === "desc" ? -1 : 1;
    const validSortFields = ["createdAt", "title", "views"];

    if (!validSortFields.includes(sortBy)) {
        throw new ApiError(400, "Invalid sortBy parameter");
    }

    const filter = query ? { title: { $regex: query, $options: "i" } } : {};

    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize);

    const totalVideos = await Video.countDocuments(filter);
    const hasNextPage = pageNumber * pageSize < totalVideos;
    const hasPrevPage = pageNumber > 1;

    return res.status(200).json(
        new ApiResponse(200, { videos, total: totalVideos, hasNextPage, hasPrevPage }, "Videos Fetched Successfully")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "Video File and thumbnail are required");
    }

    const videoFile = req.files.videoFile[0];
    const thumbnail = req.files.thumbnail[0];

    const allowedVideoFormats = ["video/mp4", "video/avi"];
    const allowedImageFormats = ["image/jpeg", "image/png"];

    if (!allowedVideoFormats.includes(videoFile.mimetype) || !allowedImageFormats.includes(thumbnail.mimetype)) {
        throw new ApiError(400, "Invalid file format");
    }

    try {
        const [videoUploadResult, thumbnailUploadResult] = await Promise.all([
            uploadOnCloudinary(videoFile.path, "video"),
            uploadOnCloudinary(thumbnail.path, "image"),
        ]);

        const videoDuration = videoUploadResult?.duration;
        if (!videoDuration) {
            throw new ApiError(400, "Failed to retrieve video duration");
        }

        const newVideo = await Video.create({
            title,
            description,
            video: videoUploadResult.secure_url,
            thumbnail: thumbnailUploadResult.secure_url,
            duration: videoDuration,
            owner: userId,
        });

        return res
            .status(201)
            .json(new ApiResponse(201, newVideo, "Video Published Successfully"));
    } catch (error) {
        console.error("Error in Video Publishing:", error);
        throw new ApiError(500, "Failed to upload video or thumbnail");
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    validateObjectId(videoId, "Invalid Video Id");

    const video = await Video.findById(videoId).populate("owner", "username email fullName avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video Fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    validateObjectId(videoId, "Invalid Video Id");

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!req.user || req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "Forbidden: You are not the owner of this video");
    }

    try {
        if (req.file) {
            if (video.thumbnail) {
                await deleteFromCloudinary(video.thumbnail);
            }

            const thumbnailUploadResult = await uploadOnCloudinary(req.file.path, "image");
            video.thumbnail = thumbnailUploadResult.secure_url;
        }

        if (title) {
            video.title = title;
        }

        if (description) {
            video.description = description;
        }

        await video.save();

        return res.status(200).json(new ApiResponse(200, video, "Video Updated Successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to update video");
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    validateObjectId(videoId, "Invalid Video Id");

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!req.user || req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "Forbidden: You are not the owner of this video");
    }

    try {
        await Promise.all([
            video.thumbnail && deleteFromCloudinary(video.thumbnail),
            video.video && deleteFromCloudinary(video.video),
        ]);

        await video.deleteOne();

        return res.status(200).json(new ApiResponse(200, null, "Video Deleted Successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to delete video or associated files");
    }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    validateObjectId(videoId, "Invalid Video Id");

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!req.user || req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, "Forbidden: You are not the owner of this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`));
});

export {
    getAllVideos,
    getVideoById,
    publishAVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
