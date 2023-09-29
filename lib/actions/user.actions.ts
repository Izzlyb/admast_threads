"use server";

import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { revalidatePath } from "next/cache";
import { FilterQuery, SortOrder } from "mongoose";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string; 
  image: string; 
  path: string; 
}


export async function updateUser({
        userId,
        username,
        name,
        bio, 
        image,
        path 
} : Params ) : Promise<void> {
  connectToDB();

  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name, 
        bio,
        image,
        onborded: true
      },
      {
        upsert: true 
      }
    );

    if( path === "/profile/edit" ) {
      revalidatePath(path);
    }

    console.log("updateUser - try block successfully executed.");

  } catch ( err: any ) {
    throw new Error( `Failed to create/update user: ${err.message}`)
  }
}


export async function fetchUser( userId: string ) {
  try {
    connectToDB();

    return await User
        .findOne({ id: userId });
        // .populate({
        //     path: "communities",
        //     model: Community
        // })

  } catch ( err: any ) {
    throw new Error(`Failed to fetch user: ${err.message}`);
  }
}


export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    // Find all threads authored by the user with the given userId
    const threads = await User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });

    console.log(`fetchUserPosts ==> returning threads : ${threads._id}`);
    return threads;
  } catch (error) {
    console.error("Error fetching user threads:", error);
    throw error;
  }
}

export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc"
} : {
    userId: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;
    const regex = new RegExp(searchString, "i");

    // Find all threads authored by the user with the given userId
 
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }
    }

    if(searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex} }
      ]
    }

    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
              .sort(sortOptions)
              .skip(skipAmount)
              .limit(pageSize)

    const totalUsersCount = await User.countDocuments(query);
    
    const users = await usersQuery.exec();

    const isNext = totalUsersCount > skipAmount + users.length;

    console.log(`fetchUserPosts ==> returning threads : `);
    return { users, isNext };

  } catch (error) {
    console.error("Error while adding comment:", error);
    throw new Error("Unable to add comment");
  }
}

export async function getActivity(userId: string) {

  try {
    connectToDB();

    // Find all threads authored by the user with the given userId
    const userThreads = await Thread.find({ author: userId });
    // Collect all the child thread ids (replies) from the "children" field
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children)
    }, [])

    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId }
    }). populate({
      path: 'author',
      model: User,
      select: 'name image _id'
    })

    console.log(`fetchUserPosts ==> returning threads : ${replies.length}`);

    return replies;

  } catch (error) {
    console.error("Error fetching user threads:", error);
    throw error;
  }

}