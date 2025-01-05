import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        videos: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        thumbnail: {
            type: String, // Store the Cloudinary URL
            default: null, // Default to null if no thumbnail is provided
        },
    },
    {
        timestamps: true,
    }
);

// Export the model
export const Playlist = mongoose.model("Playlist", playlistSchema);
