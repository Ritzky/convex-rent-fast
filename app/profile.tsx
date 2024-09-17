"use client";

import { useAuthClient } from './AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function Profile() {
	const { isAuthenticated, isLoading } = useAuthClient();
	const router = useRouter();
	const userRole = useQuery(api.users.getUserRole);
	const userProfile = useQuery(api.users.getUserProfile); // Fetch user profile

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			if (isProfileEmpty(userProfile)) {
				router.push(`/profile-input`); // Redirect to profile input page if profile is empty
			} else {
				router.push('/dashboard'); // Redirect to dashboard if profile is filled
			}
		}
	}, [isLoading, isAuthenticated, userProfile, router]);
	if (isLoading) {
		return <div>Loading...</div>;
	}

	return null; // No need to render anything if already redirected
}

function isProfileEmpty(profile: any) { 
	// Check if the profile has default values
	return !profile || Object.values(profile).every(value => 
		value === '' || value === 0 || (Array.isArray(value) && value.length === 0)
	);
}