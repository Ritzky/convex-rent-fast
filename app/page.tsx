"use client";

import { useAuthClient } from './AuthProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '@/images/logo.png';
import { CONVEX_SERVER_URL } from "@/lib/server";
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);

  const { isAuthenticated, isLoading } = useAuthClient();
  const router = useRouter();
  const userRole = useQuery(api.users.getUserRole);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-96">
        {isLoading || isAuthenticated ? (
          <div>Loading...</div>
        ) : isLogin ? (
          <LoginForm switchToSignup={() => setIsLogin(false)} />
        ) : (
          <SignupForm switchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}

// User Data Type Definition
type UserData = {
  fullName: string;
  email?: string;
  password?: string;
  numberOfProperties?: number;
  currentIncome?: number;
  jobTitle?: string;
  currentAddress?: string;
  smoking?: boolean;
  pets?: number;
  areaToMove?: string;
  miles?: number;
  moveDate?: string;
  availability?: string[];
  keySkills?: string[];
  images?: File[];
  summary?: string;
};

export function SignupForm() {
  const [role, setRole] = useState<'Tenant' | 'Landlord' | 'Maintenance' | 'Cleaner'>('Tenant');
  const [formData, setFormData] = useState<UserData>({
    email: '',
    password: '',
    fullName: '',
  });
  const [availability, setAvailability] = useState<string[]>([]);
  const [step, setStep] = useState<number>(1);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const router = useRouter();

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle next question or move to summary
  const handleNextQuestion = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      setShowSummary(true);
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: any = {
      ...(role === 'Landlord' && {
        details: {
          fullName: formData.fullName,
          numberOfProperties: Number(formData.numberOfProperties),
        },
      }),
      ...(role === 'Tenant' && {
        currentAddress: formData.currentAddress,
        currentIncome: Number(formData.currentIncome),
        areaToMove: formData.areaToMove,
        miles: Number(formData.miles),
        moveDate: formData.moveDate,
        smoker: formData.smoking ? 'yes' : 'no',
        pets: Number(formData.pets),
      }),
      ...(role === 'Maintenance' || role === 'Cleaner' && {
        availability: availability,
        keySkills: formData.keySkills || [],
        areaToMove: formData.areaToMove,
        miles: Number(formData.miles),
        summary: formData.summary,
        images: ['image1.jpg', 'image2.jpg'], // Placeholder for images
      }),
    };

    const payload = {
      role,
      email: formData.email,
      password: formData.password,
      profile: {
        details: profileData,
      },
    };

    try {
      const response = await fetch(`${CONVEX_SERVER_URL}/auth/signUp`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Sign-up failed');
      }

      // On success, redirect or handle accordingly
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>

      {/* Role Selection */}
      <div className="flex justify-around mb-4">
        {['Tenant', 'Landlord', 'Maintenance', 'Cleaner'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRole(item as 'Tenant' | 'Landlord' | 'Maintenance' | 'Cleaner')}
            className={`py-2 px-4 rounded-lg ${role === item ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Steps for filling the form */}
      {!showSummary && (
        <>
          {step === 1 && (
            <>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
            </>
          )}

          {/* Conditional fields based on role */}
          {step === 2 && role === 'Landlord' && (
            <input
              type="number"
              name="numberOfProperties"
              placeholder="Number of Properties"
              value={formData.numberOfProperties || ''}
              onChange={handleInputChange}
              required
              className="mb-4 p-2 border rounded"
            />
          )}

          {step === 2 && role === 'Tenant' && (
            <>
              <input
                type="text"
                name="currentAddress"
                placeholder="Current Address"
                value={formData.currentAddress || ''}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
              <input
                type="number"
                name="currentIncome"
                placeholder="Current Income"
                value={formData.currentIncome || ''}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
              <input
                type="text"
                name="areaToMove"
                placeholder="Area to Move"
                value={formData.areaToMove || ''}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
              <input
                type="number"
                name="miles"
                placeholder="Miles Willing to Travel"
                value={formData.miles || ''}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
              <input
                type="text"
                name="moveDate"
                placeholder="Move Date"
                value={formData.moveDate || ''}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
              <label className="mb-4">
                Smoker?
                <input
                  type="checkbox"
                  name="smoking"
                  checked={!!formData.smoking}
                  onChange={handleInputChange}
                  className="ml-2"
                />
              </label>
              <input
                type="number"
                name="pets"
                placeholder="Number of Pets"
                value={formData.pets || ''}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
            </>
          )}

          {step === 2 && (role === 'Maintenance' || role === 'Cleaner') && (
            <>
              <label className="mb-4">Availability</label>
              <textarea
                name="availability"
                placeholder="Availability"
                value={availability.join(', ') || ''}
                onChange={(e) => setAvailability(e.target.value.split(', '))}
                className="mb-4 p-2 border rounded"
              />
              <input
                type="text"
                name="keySkills"
                placeholder="Key Skills"
                value={formData.keySkills?.join(', ') || ''}
                onChange={handleInputChange}
                required
                className="mb-4 p-2 border rounded"
              />
              <textarea
                name="summary"
                placeholder="Summary"
                value={formData.summary || ''}
                onChange={handleInputChange}
                className="mb-4 p-2 border rounded"
              />
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            {step > 1 && (
              <button type="button" onClick={handlePreviousQuestion} className="bg-gray-300 py-2 px-4 rounded">
                Back
              </button>
            )}
            <button type="button" onClick={handleNextQuestion} className="bg-blue-500 text-white py-2 px-4 rounded">
              Next
            </button>
          </div>
        </>
      )}

      {/* Summary & Submit Section */}
      {showSummary && (
        <>
          <h2 className="text-xl font-bold mb-4">Summary of your details</h2>
          <pre className="mb-4">{JSON.stringify(formData, null, 2)}</pre>
          <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded">
            Submit
          </button>
          <button type="button" onClick={() => setShowSummary(false)} className="ml-2 bg-gray-300 py-2 px-4 rounded">
            Edit
          </button>
        </>
      )}
    </form>
  );
}

function LoginForm({ switchToSignup }: { switchToSignup: () => void }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = (e) => {
		e.preventDefault();
		fetch(`${CONVEX_SERVER_URL}/auth/signIn`, {
      method: "POST",
      credentials: "include", // Ensure cookies are included if needed
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
		.then(response => {
			if (!response.ok) throw new Error('Login failed');
			// Handle successful login
		})
		.catch(error => {
			alert(error.message);
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col">
			<h1 className="text-2xl font-bold text-center mb-4 text-gray-800">Login</h1>
			<input className='border rounded p-2 mb-4 text-gray-800'
				type="email"
				name="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Email"
				required
			/>
			<input className='border rounded p-2 mb-4 text-gray-800'
				type="password"
				name="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="Password"
				required
			/>
			<button type="submit" className="mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition">Login</button>
			<p className="text-center mt-4 text-gray-700">
				Don't have an account?{' '}
				<button type="button" onClick={switchToSignup} className="text-blue-500">Sign up</button>
			</p>
		</form>
	);
}