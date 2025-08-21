import { Hash } from "crypto";

export interface User {
    id: string;
    name: string;
    email: string;
    campus: string;
    bio?: string;
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
    department: string;
    links: { [key: string]: string };
    positions?: Array<{
        title?: string;
        description?: string;
        requirements?: string[];
        questions?: { [key: string]: { [key: string]: string } };
        date_posted: string;
        deadline: string;
        status: 'open' | 'closed';
        positionId: string;
    }>;
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
    department: string;
    links: string[];
}

export interface PendingClub {
    id: string;
    user: string;
    club_name: string;
    club_campus: string;
    club_description: string;
    created_at: string;
    club_image: string;
    club_instagram: string;
    club_department: string;
    status: 'pending' | 'approved' | 'rejected';
    message?: string;
}
