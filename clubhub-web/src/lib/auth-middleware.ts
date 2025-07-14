import { NextRequest } from 'next/server';
import { auth, firestore } from '@/app/api/firebaseAdmin';

export interface AuthResult {
    uid: string | null;
    isAdmin: boolean;
    isExecutive: boolean;
    error?: string;
    status?: number;
}

export interface PermissionResult {
    authorized: boolean;
    error?: string;
    status?: number;
}

export interface APIPermission {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    requiresExecOrAdmin?: boolean;
    requiresAdminOrSelf?: boolean;
}

// API endpoint permissions configuration
export const API_PERMISSIONS: Record<string, APIPermission> = {
    // User endpoints
    'PUT /api/users': { requiresAdminOrSelf: true },
    'DELETE /api/users': { requiresAdmin: true },
    
    // Club endpoints  
    'POST /api/clubs': { requiresAdmin: true },
    'PUT /api/clubs': { requiresExecOrAdmin: true },
    'DELETE /api/clubs': { requiresExecOrAdmin: true },
    
    // Post endpoints
    'POST /api/posts': { requiresExecOrAdmin: true },
    'PUT /api/posts': { requiresExecOrAdmin: true },
    'DELETE /api/posts': { requiresExecOrAdmin: true },
    
    // Pending clubs endpoints
    'GET /api/pending-clubs': { requiresAdmin: true },
    'POST /api/pending-clubs': { requiresAuth: true },
    'DELETE /api/pending-clubs': { requiresAdmin: true },
    
    // Upload endpoints
    'POST /api/upload': { requiresAuth: true },
    
    // Follow and like endpoints (authenticated users only)
    'POST /api/follow': { requiresAuth: true },
    'DELETE /api/follow': { requiresAuth: true },
    'POST /api/likes': { requiresAuth: true },
    'DELETE /api/likes': { requiresAuth: true }
};

/**
 * Get current user ID and permissions from request
 */
export async function getCurrentUserAuth(request: NextRequest): Promise<AuthResult> {
    try {
        // Verify the user is authenticated using Firebase ID token
        const authorization = request.headers.get('Authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return { uid: null, isAdmin: false, isExecutive: false, error: 'Unauthorized - Missing token', status: 401 };
        }
        
        const idToken = authorization.split('Bearer ')[1];

        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(idToken);
        } catch (error) {
            console.error('Error verifying ID token:', error);
            return { uid: null, isAdmin: false, isExecutive: false, error: 'Unauthorized - Invalid token', status: 401 };
        }

        const uid = decodedToken.uid;
        
        // Get user permissions from Firestore
        const userDoc = await firestore.collection('Users').doc(uid).get();
        
        if (!userDoc.exists) {
            return { uid, isAdmin: false, isExecutive: false, error: 'User not found', status: 404 };
        }

        const userData = userDoc.data();
        
        return { 
            uid, 
            isAdmin: userData?.is_admin || false,
            isExecutive: userData?.is_executive || false,
            status: 200 
        };
        
    } catch (error: any) {
        console.error('Error getting current user auth:', error);
        return { uid: null, isAdmin: false, isExecutive: false, error: error.message, status: 500 };
    }
}

/**
 * Check if user has permission to modify a specific post
 */
export async function checkPostPermissions(request: NextRequest, postId: string): Promise<PermissionResult> {
    try {
        const authResult = await getCurrentUserAuth(request);
        if (!authResult.uid || authResult.error) {
            return { authorized: false, error: authResult.error || 'Unauthorized', status: authResult.status || 401 };
        }

        // Admins can modify any post
        if (authResult.isAdmin) {
            return { authorized: true, status: 200 };
        }

        // Get post document
        const postDoc = await firestore.collection('Posts').doc(postId).get();
        if (!postDoc.exists) {
            return { authorized: false, error: 'Post not found', status: 404 };
        }

        const postData = postDoc.data();
        if (!postData?.club) {
            return { authorized: false, error: 'Post data invalid', status: 404 };
        }

        // Get club document to check if user is an executive
        const clubDoc = await firestore.collection('Clubs').doc(postData.club).get();
        if (!clubDoc.exists) {
            return { authorized: false, error: 'Club not found', status: 404 };
        }

        const clubData = clubDoc.data();
        const executives = clubData?.executives || [];
        
        // Check if user is an executive of the club
        if (executives.includes(authResult.uid)) {
            return { authorized: true, status: 200 };
        }

        return { authorized: false, error: 'Forbidden - Not an executive of this club', status: 403 };
        
    } catch (error: any) {
        console.error('Error checking post permissions:', error);
        return { authorized: false, error: error.message, status: 500 };
    }
}

/**
 * Check if user has permission to modify a specific club
 */
export async function checkClubPermissions(request: NextRequest, clubId: string): Promise<PermissionResult> {
    try {
        const authResult = await getCurrentUserAuth(request);
        if (!authResult.uid || authResult.error) {
            return { authorized: false, error: authResult.error || 'Unauthorized', status: authResult.status || 401 };
        }

        // Admins can modify any club
        if (authResult.isAdmin) {
            return { authorized: true, status: 200 };
        }

        // Get club document
        const clubDoc = await firestore.collection('Clubs').doc(clubId).get();
        if (!clubDoc.exists) {
            return { authorized: false, error: 'Club not found', status: 404 };
        }

        const clubData = clubDoc.data();
        const executives = clubData?.executives || [];
        
        // Check if user is an executive of the club
        if (executives.includes(authResult.uid)) {
            return { authorized: true, status: 200 };
        }

        return { authorized: false, error: 'Forbidden - Not an executive of this club', status: 403 };
        
    } catch (error: any) {
        console.error('Error checking club permissions:', error);
        return { authorized: false, error: error.message, status: 500 };
    }
}

/**
 * Check if user has permission for user-related operations
 */
export async function checkUserPermissions(request: NextRequest, targetUserId?: string): Promise<PermissionResult> {
    try {
        const authResult = await getCurrentUserAuth(request);
        if (!authResult.uid || authResult.error) {
            return { authorized: false, error: authResult.error || 'Unauthorized', status: authResult.status || 401 };
        }

        // Admins can modify any user
        if (authResult.isAdmin) {
            return { authorized: true, status: 200 };
        }

        // Users can modify themselves
        if (targetUserId && authResult.uid === targetUserId) {
            return { authorized: true, status: 200 };
        }

        // For operations without specific target user, require admin
        if (!targetUserId) {
            return { authorized: false, error: 'Forbidden - Admin access required', status: 403 };
        }

        return { authorized: false, error: 'Forbidden - Can only modify your own profile', status: 403 };
        
    } catch (error: any) {
        console.error('Error checking user permissions:', error);
        return { authorized: false, error: error.message, status: 500 };
    }
}

/**
 * Generic API permission checker based on endpoint and method
 */
export async function checkAPIPermissions(request: NextRequest, endpoint: string): Promise<PermissionResult> {
    const method = request.method;
    const permissionKey = `${method} ${endpoint}`;
    const permissions = API_PERMISSIONS[permissionKey as keyof typeof API_PERMISSIONS];

    if (!permissions) {
        // If no specific permissions configured, allow access (for GET requests mostly)
        return { authorized: true, status: 200 };
    }

    const authResult = await getCurrentUserAuth(request);
    
    if (permissions.requiresAuth && !authResult.uid) {
        return { authorized: false, error: 'Authentication required', status: 401 };
    }

    if (permissions.requiresAdmin && !authResult.isAdmin) {
        return { authorized: false, error: 'Admin access required', status: 403 };
    }

    if (permissions.requiresExecOrAdmin && !authResult.isAdmin && !authResult.isExecutive) {
        return { authorized: false, error: 'Executive or admin access required', status: 403 };
    }

    return { authorized: true, status: 200 };
}

/**
 * Middleware wrapper for API routes that automatically enforces permissions from API_PERMISSIONS
 */
export function withAuth(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
        const authResult = await getCurrentUserAuth(request);
        
        // Always require authentication first
        if (!authResult.uid || authResult.error) {
            return new Response(
                JSON.stringify({ error: authResult.error || 'Unauthorized' }),
                { status: authResult.status || 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Automatically determine required permissions from API_PERMISSIONS
        const method = request.method;
        const pathname = new URL(request.url).pathname;
        const permissionKey = `${method} ${pathname}`;
        const permissions = API_PERMISSIONS[permissionKey];

        if (permissions) {
            // requiresAuth is already satisfied by the authentication check above
            
            // Check admin requirement
            if (permissions.requiresAdmin && !authResult.isAdmin) {
                return new Response(
                    JSON.stringify({ error: 'Admin access required' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Check executive or admin requirement
            if (permissions.requiresExecOrAdmin && !authResult.isAdmin && !authResult.isExecutive) {
                return new Response(
                    JSON.stringify({ error: 'Executive or admin access required' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Check admin or self requirement  
            if (permissions.requiresAdminOrSelf) {
                const url = new URL(request.url);
                let targetUserId = url.searchParams.get('id');

                if (!targetUserId && method === 'PUT') {
                    try {
                        const body = await request.clone().json();
                        targetUserId = body.id;
                    } catch (e) {
                        console.error('Error getting target user ID:', e);
                    }
                }
                
                // If no specific user ID, require admin (for searches/listing)
                if (!targetUserId && !authResult.isAdmin) {
                    return new Response(
                        JSON.stringify({ error: 'Admin access required for user search' }),
                        { status: 403, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                
                // If targeting specific user, allow if admin OR accessing own data
                if (targetUserId && !authResult.isAdmin && authResult.uid !== targetUserId) {
                    return new Response(
                        JSON.stringify({ error: 'You can only access your own profile' }),
                        { status: 403, headers: { 'Content-Type': 'application/json' } }
                    );
                }
            }
        }

        (request as any).auth = authResult;
        
        return handler(request, ...args);
    };
}