export interface User {
    id: string;
    name: string;
    email: string;
    campus: string;
    bio: string;
    followed_clubs: string[];
    liked_posts: string[];
    is_admin: boolean;
    is_executive: boolean;
    managed_clubs: string[];
}

export interface Club {
    id: string;
    name: string;
    description: string;
    campus: string;
    image: string;
    instagram: string;
    followers: number; 
    executives: string[];
    links: string[];
}

export interface Post {
    id: string;
    title: string;
    details: string;
    campus: string;
    club: string;
    category: string;
    hashtags: string[];
    date_occuring: string;
    date_posted: string;
    likes: number;
    image: string;
    links: string[];
}
