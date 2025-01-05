import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    // Build a healthcheck response with a status and a message
    const healthStatus = {
        status: "OK",
        message: "Service is running smoothly",
        timestamp: new Date().toISOString(),
    };

    return res.status(200).json(new ApiResponse(200, healthStatus, "Healthcheck successful"));
});

export {
    healthcheck
};
