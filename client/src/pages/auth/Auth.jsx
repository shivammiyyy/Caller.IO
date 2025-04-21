import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUser } from '@/context/userContextApi';
import apiClient from '../../apiClient.js';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

export const Auth = ({ type }) => {
  const { updateUser } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'signup' && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      const endpoint = type === 'signup' ? '/auth/signup' : '/auth/login';
      const response = await apiClient.post(endpoint, formData);
      toast.success(response.data.message || 'Success!');
      if (type === 'signup') {
        navigate('/login');
      }
      if (type === 'login') {
        updateUser(response.data);
        // Save token in cookies (expires in 30 days)
        const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const expires = 'expires=' + date.toUTCString();
        document.cookie = `jwt=${response.data.token}; path=/; ${expires}`;
        navigate('/');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Something went wrong!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-2xl font-bold text-center">
            {type === 'signup'
              ? 'Sign Up - Caller.io'
              : 'Login - Caller.io'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'signup' && (
              <>
                <div className="flex items-center border rounded-md bg-gray-50 px-3 py-2">
                  <FaUser className="text-purple-500 mr-2" />
                  <input
                    type="text"
                    name="fullname"
                    placeholder="Full Name"
                    className="w-full bg-transparent focus:outline-none"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex items-center border rounded-md bg-gray-50 px-3 py-2">
                  <FaUser className="text-purple-500 mr-2" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username (e.g., Jondo99)"
                    className="w-full bg-transparent focus:outline-none"
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
            <div className="flex items-center border rounded-md bg-gray-50 px-3 py-2">
              <FaEnvelope className="text-purple-500 mr-2" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full bg-transparent focus:outline-none"
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-center border rounded-md bg-gray-50 px-3 py-2">
              <FaLock className="text-purple-500 mr-2" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full bg-transparent focus:outline-none"
                onChange={handleChange}
                required
              />
            </div>
            {type === 'signup' && (
              <>
                <div className="flex items-center border rounded-md bg-gray-50 px-3 py-2">
                  <FaLock className="text-purple-500 mr-2" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="w-full bg-transparent focus:outline-none"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Male
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Female
                  </label>
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium py-2 rounded-md hover:opacity-90 transition"
            >
              {loading
                ? 'Loading...'
                : type === 'signup'
                ? 'Sign Up'
                : 'Login'}
            </button>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 text-center">
          {type === 'signup' ? (
            <p className="text-sm">
              Already have an account?{' '}
              <Link to="/login" className="underline text-purple-600">
                Login
              </Link>
            </p>
          ) : (
            <p className="text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="underline text-purple-600">
                Register
              </Link>
            </p>
          )}
        </CardFooter>
      </Card>
      <Toaster position="top-center" />
    </div>
  );
};

export default Auth;
