import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const parsedPage = Math.max(1, Number(page));
    const parsedLimit = Math.max(1, Number(limit));

    const [comments, totalComments] = await Promise.all([
        Comment.aggregate([
            { $match: { video: mongoose.Types.ObjectId(videoId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                },
            },
            { $unwind: "$ownerDetails" },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    "ownerDetails.username": 1,
                    "ownerDetails.avatar": 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ])
            .skip((parsedPage - 1) * parsedLimit)
            .limit(Number(parsedLimit)),

        Comment.countDocuments({ video: mongoose.Types.ObjectId(videoId) }),
    ]);

    if (comments.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No comments found for this video"));
    }

    return res.status(200).json(new ApiResponse(200, { comments, totalComments }, "Comments retrieved successfully"));
});
const addComment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user?._id;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    if (!content||content.trim()==="") {
        throw new ApiError(400, "Comment content is required");
    }
    if(!userId){
        throw new ApiError(401,"You must be logged in to add a comment")
    }
    const videoExists = await Video.findById(videoId).lean();
    if(!videoExists){
        throw new ApiError(404,"Video not found")
    }
    const newComment = new Comment({
        content,
        video:videoId,
        owner:userId,
    });
    const savedComment = await newComment.save();
    const populatedComment = await savedComment.populate({
        path: "owner",
        select: "username avatar",
    });
    return res  
        .status(201)
        .json(new ApiResponse(201,populatedComment,"Comment added successfully"))
})
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user is the owner of the comment
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    // Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    // Update the comment
    comment.content = content;
    const updatedComment = await comment.save();

    // Return the updated comment
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    // Find the comment by ID
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user is the owner of the comment or an admin
    if (comment.owner.toString() !== userId.toString() && !req.user?.isAdmin) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    // Delete the comment
    await comment.remove();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
    }