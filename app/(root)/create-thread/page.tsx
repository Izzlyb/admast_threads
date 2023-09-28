import PostThread from "@/components/forms/PostThread";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";


async function Page() {
  const user = await currentUser();

  if( !user ) {
    console.log("did not get user from currentUser()", "color:red; font-size:30px");
    return null;
  }

  console.log(`currentUser: ${user.id}.`);
  const userInfo = await fetchUser(user.id);

  console.log(`on create-tread: from database userInfo: ${userInfo.id}.`, "color:blue; font-size:40px");
  // if( !userInfo?.onborded ) redirect("/onboarding");

  return (
    <>
      <h1 className="head-text" > 
        Create a new Thread
      </h1>

      <PostThread userId = {userInfo._id} />
    </>
  )
}

export default Page;
