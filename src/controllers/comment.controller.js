import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId, content } = req.body;
  const userId = req.user?._id;

  if (!videoId || !content) {
    throw new ApiError(400, "Please add a content to the comment!");
  }

  const postComment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!postComment) {
    throw new ApiError(400, "Comment not posted!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, postComment, "Comment posted!"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
