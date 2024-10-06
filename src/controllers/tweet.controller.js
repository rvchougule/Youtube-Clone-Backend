import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const userId = req.user?._id;

  console.log(content);

  if (!content) {
    throw new ApiError(400, "Tweet content missing");
  }

  const postTweet = await Tweet.create({
    content,
    owner: userId,
  });

  if (!postTweet) {
    throw new ApiError(400, "Tweet not posted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, postTweet, "Tweet posted successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const allTweets = await Tweet.find({
    owner: new mongoose.Types.ObjectId(userId),
  });

  if (allTweets.length === 0) {
    throw new ApiError(404, "No tweets were found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allTweets, "Tweets Fetched"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  // 1. get tweetId from params URL and content from req.body
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID provided");
  }
  if (!content) {
    throw new ApiError(400, "Please write something!");
  }

  // 2. find the tweet by tweetId and req.user._id. // only owner can update the tweet
  const findTweet = await Tweet.findOne({
    $and: [
      { owner: new mongoose.Types.ObjectId(req.user?._id) },
      { _id: tweetId },
    ],
  });

  if (!findTweet) {
    throw new ApiError(400, "You are not authorized to update this tweet");
  }

  // 3. update the tweet content and save it to the database
  findTweet.content = content;
  const updatedTweet = await findTweet.save();

  if (!updatedTweet) {
    throw new ApiError(500, "Tweet not updated!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  // 1. get tweetId from params URL and content from req.body
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID provided");
  }

  // 2. find the tweet by tweetId and req.user._id. // only owner can update the tweet
  const findTweet = await Tweet.findOne({
    $and: [
      { owner: new mongoose.Types.ObjectId(req.user?._id) },
      { _id: tweetId },
    ],
  });

  if (!findTweet) {
    throw new ApiError(400, "You are not authorized to Delete this tweet");
  }

  const delTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!delTweet) {
    throw new ApiError(500, "Tweet not Deleted!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, delTweet, "Tweet Deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
