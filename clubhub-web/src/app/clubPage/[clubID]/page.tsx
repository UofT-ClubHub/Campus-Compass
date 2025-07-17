
import db from '@/model/firebase';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { Post } from '@/model/types';
import { PostCard } from '@/components/post-card';
import { Users, UserCheck, Instagram, MapPin } from "lucide-react"


interface PageProps {
  params: Promise<{
    clubID: string;
  }>;
}

async function getClubPosts(clubID: string) {
  try {
    const firestore = getFirestore(db);
    //Get name of the club
    const clubRef = collection(firestore, 'Clubs');
    const clubQuery = query(clubRef, where('__name__', '==', clubID));
    const clubSnapshot = await getDocs(clubQuery);
    
    let clubData = null;
    if (!clubSnapshot.empty) {
      clubData = clubSnapshot.docs[0].data();
    }

    // Get posts for this club
    const postsRef = collection(firestore, 'Posts'); 
    const postsQuery = query(postsRef, where('club', '==', clubID));
    const postsSnapshot = await getDocs(postsQuery);
    
    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[];
    
    return {clubData, posts};
  } catch (error) {
    console.error('Error fetching club posts:', error);
    return {clubData: null, posts: []};
  }
}

export default async function ClubPage({ params }: PageProps) {
  const { clubID } = await params;
  const { clubData, posts } = await getClubPosts(clubID);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="relative text-white rounded-xl p-10 mb-12 mx-auto shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center filter blur-md" style={{backgroundImage: `url(${clubData?.image || "/placeholder.svg"})`}}></div>
        <div className="absolute inset-0 bg-black/45"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Logo and Title Section */}
          <div className="mb-8 flex flex-col items-center">
            <img
              src={clubData?.image || "/placeholder.svg"}
              alt={`${clubData?.name} logo`}
              className="w-24 h-24 rounded-full mb-4 border-4 border-white/40 backdrop-blur-sm"
            />
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{clubData?.name}</h1>
            <p className="text-white-100 text-lg font-bold leading-relaxed">{clubData?.description}</p>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-8 pt-6 border-t border-white-300">
            <div className="flex items-center gap-2 text-white">
              <Users className="w-4 h-4 text-white-200" />
              <span className="font-medium ">{clubData?.followers}</span>
              <span className="text-white-200 text-sm font-bold">Followers</span>
            </div>

            <div className="flex items-center gap-2 text-white">
              <UserCheck className="w-4 h-4 text-green-300" />
              <span className="font-medium">{clubData?.executives}</span>
              <span className="text-white-200 text-sm font-bold">executives</span>
            </div>

            <div className="flex items-center gap-2 text-white">
              <Instagram className="w-4 h-4 text-pink-300" />
              <span className="font-medium font-bold">{clubData?.instagram}</span>
            </div>

            <div className="flex items-center gap-2 text-white ">
              <MapPin className="w-4 h-4 text-orange-300" />
              <span className="font-medium font-bold">{clubData?.campus}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ——— Posts Section ——— */}
      <div className="w-full bg-gray-50 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <h2 className="text-4xl font-bold text-blue-600 mb-6 text-center"></h2>
            
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts found</h3>
                <p className="text-gray-500 text-sm">This club hasn't posted anything yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 -mt-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}