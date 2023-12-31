"use server";

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Community from "../models/community.model";

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}


export async function createThread({text, author, communityId, path }: Params ) {
  
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdThread = await Thread.create({
      text,
      author,
      community: communityId,
    });
  
    console.log(`Thread created successfully: ${createdThread.text}`);
    // Update user Model:
    await User.findByIdAndUpdate(author, {
        $push: { threads: createdThread._id }
    })
  
    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error creating thread: ${error.message}`);
  }
}


export async function fetchPosts(pageNumber = 1, pageSize = 20 ) {
  try {
    connectToDB();

    // Calculate the number of posts to skip:
    const skipAmount = (pageNumber -1 ) * pageSize;

    // Fetch the posts that have no parents, the root threads (top-level threads.)
    const postsQuery = Thread.find({parentId: { $in: [null, undefined]}})
        .sort({ createAt: 'desc'})
        .skip(skipAmount)
        .limit(pageSize)
        .populate({ path: 'author', model: User })
        .populate({
              path: 'children', 
              populate: {
                path: 'author',
                model: User,
                select: "_id name parentId image"
              }
          })
                                
    const totalPostsCount = await Thread.countDocuments({ parentId: {$in: [null, undefined]}})

    const posts = await postsQuery.exec();

    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };

  } catch (error) { 
      console.log(error);
  }
}


export async function fetchThreadById(id: string) {
  try {
    connectToDB();

    const thread = await Thread.findById(id)
        .populate({
          path: 'author',
          model: User,
          select: "_id id name image"
        })
        .populate({
          path: "communities",
          model: Community,
          select: "_id id name image",
        }) // Populate the community field with _id and name
        .populate( {
          path: 'children',
          populate: [
            {
              path: 'author',
              model: User,
              select: "_id id name parentId image"
            },
            {
              path: 'children',
              model: Thread,
              populate: {
                path: 'author',
                model: User,
                select: "_id id name parentId image"
              }
            }
          ],
        })
        .exec();

        return thread;

  } catch (error: any) {
    throw new Error(`Error creating thread: ${error.message}`);
  }
}


export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    // Find the original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    // Create the new comment thread
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId, // Set the parentId to the original thread's ID
    });

    // Save the comment thread to the database
    const savedCommentThread = await commentThread.save();

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id);

    // Save the updated original thread to the database
    await originalThread.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}
