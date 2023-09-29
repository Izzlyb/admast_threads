
import Image from "next/image";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { profileTabs } from "@/constants";
import UserCard from "@/components/cards/UserCard";


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

  // fetch users from database
  const result = await fetchUsers({
        userId: user.id,
        searchString: "",
        pageNumber: 1,
        pageSize: 25
  })

  return (
    <section>
      <h1 className="head-text">Page for Search</h1>

      {/* Add a search bar to enter text. 
      At the moment we'll just show the posts. */}
      <div className="mt-14 flex flex-col gap-9">
        {result.users.length === 0 ?  (
          <p className="no-result"> no users to display </p>
        ) : (
          <>
            { result.users.map((person) => (
              <UserCard 
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  username={person.username}
                  imgUrl={person.image}
                  personType='User'
                />
            ))}
          </>
        )}
      </div>
    </section>
  )
}

export default Page;
