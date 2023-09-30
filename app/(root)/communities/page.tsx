
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { fetchCommunities } from "@/lib/actions/community.actions";
import CommunityCard from "@/components/cards/CommunityCard";


const Page = async () => {

  const user = await currentUser();
  if( !user ) {
    console.log("did not get user from currentUser()", "color:red; font-size:30px");
    return null;
  }

  const userInfo = await fetchUser(user.id);
  console.log(`Profile Page == > from database userInfo: ${userInfo.id}.`);
  console.log(`Profile Page == > from userInfo.onboarded: ${userInfo.onboarded}.`);

  if( !userInfo?.onboarded ) redirect("/onboarding");

  // fetch communities from database
  const result = await fetchCommunities({
        searchString: "",
        pageNumber: 1,
        pageSize: 25
  })

  return (
    <section>
      <h1 className="head-text">Page fo=== Search</h1>

      {/* Add a search bar to enter text. 
      At the moment we'll just show the posts. */}
      <div className="mt-14 flex flex-col gap-9">
        {result.communities.length === 0 ?  (
          <p className="no-result"> no community to display </p>
        ) : (
          <>
            { result.communities.map((community) => (
              <CommunityCard 
                  key={community.id}
                  id={community.id}
                  name={community.name}
                  username={community.username}
                  imgUrl={community.image}
                  bio={community.bio}
                  members={community.members}
                />
            ))}
          </>
        )}
      </div>
    </section>
  )
}

export default Page;
