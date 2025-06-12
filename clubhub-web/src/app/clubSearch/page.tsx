'use client';

import { useState, useEffect } from 'react';
import { Club } from '@/model/types';


export default function clubSearchPage() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(false);
    const [clubList, setClubList] = useState<Club[]>([]);

    useEffect(() => {
        async function fetchClubs(){
            try {
                const res = await fetch('/api/clubs');
                if (!res.ok) {
                    throw new Error('Failed to fetch clubs');
                }
                const data = await res.json();
                const formatted: Club[] = data.map((club: any) => ({
                id: club.id || '',
                name: club.name || '',
                description: club.description || '',
                campus: club.campus || '',
                followers: club.followers ?? 0,
                image: club.image || '',
                instagram: club.instagram || '',
                executives: club.executives || [],
                links: club.links || [],
                }));

                setClubList(formatted);
            } catch (error) {
                console.error('Error fetching clubs:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchClubs();
    }, []);

    console.log(clubList);

    return (
        <div>
      <h1>Club Search</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {clubList.map((club) => (
            <li key={club.id}>
              <h2>{club.name}</h2>
              <p>{club.description}</p>
              <p>Campus: {club.campus}</p>
              <p>Followers: {club.followers}</p>
              <p>Executives: {club.executives.join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
    );
}