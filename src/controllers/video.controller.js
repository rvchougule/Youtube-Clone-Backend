import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteInCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = 1,
  } = req.query;
  const userId = req.user?._id;

  // Log to check incoming query and userId
  console.log("query", query, "userId", userId);

  let pipeline = [
    {
      $match: {
        $or: [
          {
            title: { $regex: query, $options: "i" }, // Match based on title
          },
          {
            description: { $regex: query, $options: "i" }, // Match based on description
          },
        ],
        ...(userId && { owner: new mongoose.Types.ObjectId(userId) }), // Match owner only if userId exists
      },
    },
    // Lookup the owner field (user details)
    {
      $lookup: {
        from: "videos", // Assuming the user collection is called 'users'
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner", // Add first element of owner to document
        },
      },
    },
    {
      $sort: { [sortBy]: sortType }, // Sort videos based on query param
    },
  ];

  try {
    // Set pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      customLabels: {
        totalDocs: "totalVideos",
        docs: "videos",
      },
    };

    // Fetch videos with aggregation and pagination
    const result = await Video.aggregatePaginate(
      Video.aggregate(pipeline),
      options
    );

    if (result?.videos?.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, "No Videos Found"));
    }

    console.log(result);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json(
        new ApiError(500, {}, "Internal server error in video aggregation")
      );
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  console.log(description);

  if (!title || !description) {
    throw new ApiError(400, "Title and description required ");
  }

  const videoFilePath = req.files?.videoFile?.[0].path;
  const thumbnailPath = req.files?.thumbnail?.[0].path;

  if (!videoFilePath || !thumbnailPath) {
    throw new ApiError(400, "Video file and thumbnail required");
  }
  console.log(videoFilePath, thumbnailPath);

  console.log("Multer uploaded files");

  const videoPath = await uploadOnCloudinary(videoFilePath);
  const thumbnailFilePath = await uploadOnCloudinary(thumbnailPath);

  if (!videoPath.url || !thumbnailFilePath.url) {
    throw new ApiError(500, "Server failed to upload video and thumbnail");
  }

  // console.log("videoFile", videoPath.url, "thumbnail", thumbnail.url);

  const savedVideo = await Video.create({
    videoFile: videoPath.url,
    thumbnail: thumbnailFilePath.url,
    title,
    description: description,
    duration: videoPath.duration,
    owner: req.user?._id,
  });

  if (!savedVideo) {
    throw new ApiError(500, "Error while saving video");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "The video published Successfully !"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, "videoId not found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(new ApiResponse(200, video, "Video Fetched"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { title, description } = req.body;

  if (!title && !description) {
    throw new ApiError(400, "Title and description required");
  }

  // get path from request
  const thumbnailPath = req.file?.path;

  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbnail required");
  }

  // video details fetch request
  const video = await Video.findById(videoId);

  //   upload thumbnail to cloudinary server
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!thumbnail.url) {
    throw new ApiError(500, "thumbnail file failed to be uploaded");
  }

  // delete the thumbnail from the cloudinary after new upload
  const deleteOldThumbnail = await deleteInCloudinary(video.thumbnail);

  if (deleteOldThumbnail.result !== "ok") {
    throw new ApiError(400, "old thumbnail not deleted");
  }

  // update the video details
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  // response
  return res
    .status(200)
    .json(
      new ApiResponse(200, updateVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  // verify videoId
  if (!videoId) {
    throw new ApiError(400, "VideoId required");
  }
  // fetch video details from DB server
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video details not found");
  }
  // delete video and thumbnail from cloudinary server
  const deleteVideo = await deleteInCloudinary(video.videoFile);
  const deleteThumbnail = await deleteInCloudinary(video.thumbnail);

  if (!deleteVideo.result !== "ok" && !deleteThumbnail.result !== "ok") {
    throw new ApiError(
      500,
      "Failed to delete video and thumbnail from cloudinary server"
    );
  }
  // delete video field from DB server
  const deletedVideoField = await Video.findByIdAndDelete(videoId);
  if (!deletedVideoField) {
    throw new ApiError(500, "Failed to delete video");
  }

  // response
  return response
    .status(200)
    .json(
      new ApiResponse(200, deletedVideoField, "Video deleted successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // find video field in DB collection
  const video = await Video.findById(videoId);
  // update Publish status
  const changePublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );
  // response
  return response
    .status(200)
    .json(
      new ApiResponse(200, changePublishStatus, "video publish status changed")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
