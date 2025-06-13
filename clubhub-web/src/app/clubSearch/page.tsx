'use client';

import { useState, useEffect } from 'react';
import { Club } from '@/model/types';


export default function clubSearchPage() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(false);
    const [clubList, setClubList] = useState<Club[]>([]);
    const [nameFilter, setNameFilter] = useState('');
    const [campusFilter, setCampusFilter] = useState('');
    const [descriptionFilter, setDescriptionFilter] = useState('');

    // useEffect(() => {
    //     async function fetchClubs(){
    //         try {
    //           console.log('Fetching clubs with filters:', { nameFilter, campusFilter, descriptionFilter });
    //             // const res = await fetch('/api/clubs');
    //             // if (!res.ok) {
    //             //     throw new Error('Failed to fetch clubs');
    //             // }
    //             // const data = await res.json();
    //             // const formatted: Club[] = data.map((club: any) => ({
    //             // id: club.id || '',
    //             // name: club.name || '',
    //             // description: club.description || '',
    //             // campus: club.campus || '',
    //             // followers: club.followers ?? 0,
    //             // image: club.image || '',
    //             // instagram: club.instagram || '',
    //             // executives: club.executives || [],
    //             // links: club.links || [],
    //             // }));

    //             // setClubList(formatted);

    //             const params = new URLSearchParams();

    //             nameFilter ? params.append('name', nameFilter) : null;
    //             campusFilter ? params.append('campus', campusFilter) : null;
    //             descriptionFilter ? params.append('description', descriptionFilter) : null;
    //             params.append('sort_by', 'followers');
    //             params.append('sort_order', 'desc'); // or 'asc' for ascending

    //             const res = await fetch(`/api/clubs?${params.toString()}`, {
    //               method: 'GET',
    //             });

    //             if (!res.ok) {
    //                 throw new Error('Failed to fetch clubs');
    //             }

    //             const data = await res.json();
    //             if (!Array.isArray(data)) {
    //                 throw new Error('Invalid response format');
    //             }

    //             // const formatted: Club[] = data.map((club: any) => ({
    //             //     id: club.id || '',
    //             //     name: club.name || '',
    //             //     description: club.description || '',
    //             //     campus: club.campus || '',
    //             //     followers: club.followers ?? 0,
    //             //     image: club.image || '',
    //             //     instagram: club.instagram || '',
    //             //     executives: club.executives || [],
    //             //     links: club.links || [],
    //             // }));

    //             setClubList(data as Club[]);

    //         } catch (error) {
    //             console.error('Error fetching clubs:', error);
    //         } finally {
    //             setLoading(false);
    //             console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
    //             console.log('Club list updated:', clubList);

    //         }
    //     }
    //     fetchClubs();
    // }, [nameFilter, campusFilter, descriptionFilter]);

    const clubSearch = async () => {
      try {

          const params = new URLSearchParams();

          nameFilter ? params.append('name', nameFilter) : null;
          campusFilter ? params.append('campus', campusFilter) : null;
          descriptionFilter ? params.append('description', descriptionFilter) : null;
          params.append('sort_by', 'followers');
          params.append('sort_order', 'desc'); // or 'asc' for ascending

          const res = await fetch(`/api/clubs?${params.toString()}`, {
            method: 'GET',
          });

          if (!res.ok) {
              throw new Error('Failed to fetch clubs');
          }

          const data = await res.json();
          if (!Array.isArray(data)) {
              throw new Error('Invalid response format');
          }

          setClubList(data as Club[]);

          // console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
          console.log('Club list updated:', data);

      } catch (error) {
          console.error('Error fetching clubs:', error);
      } finally {
          setLoading(false);
          // console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
          // console.log('Club list updated:', data);
      }
    }

    return (
    //     <div>
    //   <h1>Club Search</h1>
    //   {loading ? (
    //     <p>Loading...</p>
    //   ) : (
    //     <ul>
    //       {clubList.map((club) => (
    //         <li key={club.id}>
    //           <h2>{club.name}</h2>
    //           <p>{club.description}</p>
    //           <p>Campus: {club.campus}</p>
    //           <p>Followers: {club.followers}</p>
    //           <p>Executives: {club.executives.join(', ')}</p>
    //         </li>
    //       ))}
    //     </ul>
    //   )}
    // </div>

    //creating text fields for user to filter clubs by name, campus, and description
      <div>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
          <h1 className="text-2xl font-bold">Club Search</h1>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <input
              type="text"
              placeholder="Club Name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Description"
              value={descriptionFilter}
              onChange={(e) => setDescriptionFilter(e.target.value)}
              className="p-2 border rounded"
            />
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Select Campus</option>
              <option value="UTSC">UTSC</option>
              <option value="UTSG">UTSG</option>
              <option value="UTM">UTM</option>
            </select>
          </div>
          <button
            onClick={() => {
              // Implement search logic here
              console.log("Searching for clubs with filters:", {nameFilter, campusFilter, descriptionFilter});
              clubSearch();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >Search for Posts 
          </button>
        </div>
      </div>
  

    );
}