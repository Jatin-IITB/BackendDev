import {isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

const createPlaylist = asyncHandler(async(req,res)=>{
    const {name,description} = req.body;
    const {thumbnail} = req?.file;
    if(!name?.trim()){
        throw new ApiError(400,"Playlist name is required");
    }
    const existingPlaylist = await Playlist.findOne({
        name:name.trim(),
        owner:req.user?._id,
    });
    if(existingPlaylist){
        throw new ApiError(400,"Playlist with this name already exists");
    }
    let thumbnailUrl=null;
    if (thumbnail) {
        const uploadedThumbnail = await uploadOnCloudinary(thumbnail.path);
        if(!uploadedThumbnail?.url){
            throw new ApiError(500,"Failed to upload thumbnail");
        }
        thumbnailUrl = uploadedThumbnail.url;
    }
    const newPlaylist = await Playlist.create({
        name:name.trim(),
        description:description?.trim()||"",
        owner:req.user?._id,
        thumbnail:thumbnailUrl,
        videos:[],
    });
    await newPlaylist.save();
    return res
    .status(201)
    .json(new ApiResponse(201,newPlaylist,"Playlist created successfully"));
})
const getUserPlaylist=asyncHandler(async(req,res)=>{
    const {userId} = req.params;
    //can introduce pagination , from chatgpt
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id");
    }
    const playlists = await Playlist.find({owner:userId}).populate("videos");
    if (!playlists.length) {
        throw new ApiError(404,"No Playlists found for the user");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,playlists,"User Playlists fetched successfully"));
})
const getPlaylistById=asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist ID");
    }
    const playlist = await Playlist.findById(playlistId).populate("videos");
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
})
const addVideoToPlaylist=asyncHandler(async(req,res)=>{
    const {playlistId,videoId}=req.params;
    if(!isValidObjectId(playlistId)||!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid playlist or video ID");
    }
    const existingPlaylist = await Playlist.findById(playlistId);
    if (!existingPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }
    if(existingPlaylist.videos.includes(videoId)){
        throw new ApiError(400,"Video already exists in the playlist");
    }
    existingPlaylist.videos.push(videoId);
    await existingPlaylist.save();
    return res
        .status(200)
        .json(new ApiResponse(200, existingPlaylist, "Video added to playlist successfully"));
})
const removeVideoFromPlaylist=asyncHandler(async(req,res)=>{
    const {playlistId,videoId}=req.params;
    if(!isValidObjectId(playlistId)||!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid playlist or video ID");
    }
    const playlist=await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    const videoIndex = playlist.videos.indexOf(videoId);
    if(videoIndex === -1){
        throw new ApiError(400,"Video does not exist in the playlist");
    }
    playlist.videos.splice(videoIndex, 1);
    await playlist.save();
    return res
        .status(200)
        .json(new ApiResponse(200,playlist,"Video removed from playlist successfully"));
})
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.");
    }

    // Find and delete the playlist
    const playlist = await Playlist.findByIdAndDelete(playlistId);

    // Check if the playlist existed
    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }
    if (playlist.thumbnail) {
        const isDeleted = await deleteFromCloudinary(playlist.thumbnail);
        if (!isDeleted) {
            console.warn("Failed to delete thumbnail from Cloudinary");
        }
    }
    // Return success response
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Playlist deleted successfully."));
})
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    const {file:thumbnail}=req;
    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.");
    }

    // Validate input
    if (!name && !description && !thumbnail) {
        throw new ApiError(400, "At least one field (name, description, or thumbnail) must be provided to update.");
    }

    // Find and update the playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    // Update fields
    if (name) playlist.name = name;
    if (description) playlist.description = description;
    if (thumbnail) {
        const uploadedThumbnail = await uploadOnCloudinary(thumbnail.path);
        if (!uploadedThumbnail?.url) {
            throw new ApiError(400, "Thumbnail upload failed");
        }
        // Delete the old thumbnail from Cloudinary if necessary
        if (playlist.thumbnail) {
            await deleteFromCloudinary(playlist.thumbnail);
        }

        playlist.thumbnail = uploadedThumbnail.url;
    }
    // Save the updated playlist
    await playlist.save();

    // Return the updated playlist
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully."));
})

export{
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}