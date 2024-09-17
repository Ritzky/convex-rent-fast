// Import necessary modules
"use client";

import { useAuthClient } from './AuthProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CONVEX_SERVER_URL } from "./lib/server";

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
  numberOfPeople?: number;
  availability?: string[];
  keySkills?: string[];
  summary?: string;
};

// Role Type Definition
type Role = 'Tenant' | 'Landlord' | 'Maintenance' | 'Cleaner';

// SignupForm Component
interface SignupFormProps {
  switchToLogin: () => void;
}

const SignupForm = ({ switchToLogin }: SignupFormProps) => {
  const [role, setRole] = useState<Role>('Tenant');
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
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
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

  // Handle form submission
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
        details: {
          fullName: formData.fullName,
          currentAddress: formData.currentAddress,
          currentIncome: Number(formData.currentIncome),
          jobTitle: formData.jobTitle,
          areaToMove: formData.areaToMove,
          miles: formData.miles ? Number(formData.miles) : 0,
          moveDate: formData.moveDate,
          smoker: formData.smoking ? 'yes' : 'no',
          pets: Number(formData.pets),
          numberOfPeople: Number(formData.numberOfPeople),
          summary: formData.summary,
        },
      }),
      ...((role === 'Maintenance' || role === 'Cleaner') && {
        details: {
          fullName: formData.fullName || '',
          availability,
          keySkills: formData.keySkills || [],
          areaToMove: formData.areaToMove || '',
          miles: formData.miles ? Number(formData.miles) : 0,
          summary: formData.summary || '',
        },
      }),
    };
  
    const payload = {
      role,
      email: formData.email,
      password: formData.password,
      profile: profileData,
    };
  
    try {
      const response = await fetch(`${CONVEX_SERVER_URL}/auth/signUp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error('Sign-up failed');
      }
  
      router.push('/dashboard');
    } catch (error) {
      console.error('Error during sign-up:', error);
    }
  };

  return (
        <form
        onSubmit={(event) =>
          void handleSubmit(event)
        } className="flex flex-col">

      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>

      {/* Role Selection */}
      <div className="flex justify-around mb-4">
        {['Tenant', 'Landlord', 'Maintenance', 'Cleaner'].map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setRole(item as Role)}
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
                value={formData.currentAddress || ''}
                onChange={handleInputChange}
                placeholder="Current Address"
              />
              <input
                type="number"
                name="currentIncome"
                value={formData.currentIncome || ''}
                onChange={handleInputChange}
                placeholder="Current Income"
              />
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle || ''}
                onChange={handleInputChange}
                placeholder="Job Title"
              />
              <input
                type="text"
                name="areaToMove"
                value={formData.areaToMove || ''}
                onChange={handleInputChange}
                placeholder="Area to Move"
              />
              <input
                type="number"
                name="miles"
                value={formData.miles || ''}
                onChange={handleInputChange}
                placeholder="Miles"
              />
              <input
                type="date"
                name="moveDate"
                value={formData.moveDate || ''}
                onChange={handleInputChange}
                placeholder="Move Date"
              />
              <input
                type="number"
                name="numberOfPeople"
                value={formData.numberOfPeople || ''}
                onChange={handleInputChange}
                placeholder="Number of People"
              />
              <input
                type="checkbox"
                name="smoking"
                checked={formData.smoking || false}
                onChange={handleInputChange}
              />
              <label htmlFor="smoking">Smoking</label>
              <input
                type="number"
                name="pets"
                value={formData.pets || ''}
                onChange={handleInputChange}
                placeholder="Number of Pets"
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

          {/* Conditional fields based on role */}
          {step === 2 && (role === 'Maintenance' || role === 'Cleaner') && (
            <>
              <input
                type="text"
                name="areaToMove"
                value={formData.areaToMove || ''}
                onChange={handleInputChange}
                placeholder="Area to Move"
              />
              <input
                type="number"
                name="miles"
                value={formData.miles || ''}
                onChange={handleInputChange}
                placeholder="Miles"
              />
              <textarea
                name="keySkills"
                placeholder="Key Skills (comma separated)"
                value={formData.keySkills?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, keySkills: e.target.value.split(',').map(skill => skill.trim()) })}
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
              <button
                type="button"
                onClick={() => handlePreviousQuestion()}
                className="bg-gray-300 py-2 px-4 rounded"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => handleNextQuestion()}
              className="bg-blue-500 text-white py-2 px-4 rounded"
            >
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
          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setShowSummary(false)}
            className="ml-2 bg-gray-300 py-2 px-4 rounded"
          >
            Edit
          </button>
        </>
      )}
    </form>
  );
};

// LoginForm Component
interface LoginFormProps {
  switchToSignup: () => void;
}

const LoginForm = ({ switchToSignup }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${CONVEX_SERVER_URL}/auth/signIn`, {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      // Redirect or handle successful login
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
      <form
      onSubmit={(event) =>
        void handleSubmit(event)
      } className="flex flex-col">

      <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">Login</h1>
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="border rounded p-2 mb-4 text-gray-800"
      />
      <input
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="border rounded p-2 mb-4 text-gray-800"
      />
      <button
        type="submit"
        className="mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
      >
        Login
      </button>
      <p className="text-center mt-4 text-gray-700">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={switchToSignup}
          className="text-blue-500"
        >
          Sign up
        </button>
      </p>
    </form>
  );
};

// Main Component
export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuthClient();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-96">
        {isLoading ? (
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
