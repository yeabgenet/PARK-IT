import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Terminal {
    id: number;
    name: string;
    address: string;
    total_capacity: number;
    city: string;
    country: string;
    profile_image_url: string | null;
}

// Define the CSRF response type
interface CsrfResponse {
    csrfToken: string;
}

function Spterminals() {
    const [terminals, setTerminals] = useState<Terminal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const setupAxios = async () => {
            try {
                // Fetch CSRF token with typed response
                const csrfResponse = await axios.get<CsrfResponse>('/api/csrf/', {
                    withCredentials: true,
                });
                const csrfToken = csrfResponse.data.csrfToken;
                axios.defaults.headers.common['X-CSRFToken'] = csrfToken;
                fetchTerminals();
            } catch (err) {
                console.error('Error fetching CSRF token:', err);
                setError('Failed to initialize. Please try again.');
                setLoading(false);
            }
        };
        setupAxios();
    }, []);

    const fetchTerminals = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get<Terminal[]>('/api/parking-lots/', {
                withCredentials: true,
            });
            console.log('Terminals fetched:', response.data);
            setTerminals(response.data);
        } catch (err: any) {
            console.error('Error fetching terminals:', err);
            setError('Failed to fetch terminals. Ensure you are logged in as a Service Provider.');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (terminal: Terminal) => {
        return terminal.profile_image_url || '/default-image.jpg';
    };

    // Rest of the component remains unchanged
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading terminals...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
                        <h3 className="font-bold text-lg mb-2">Error</h3>
                        <p>{error}</p>
                        <button
                            onClick={fetchTerminals}
                            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Parking Terminals</h1>
                    <p className="text-gray-600 mt-2">Manage your parking terminals</p>
                </div>
                <div className="mb-6 flex justify-between items-center">
                    <Link
                        to="/addterminal"
                        className="bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        + Add New Terminal
                    </Link>
                    <button
                        onClick={fetchTerminals}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
                {terminals.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No terminals yet</h3>
                        <p className="text-gray-600 mb-4">Get started by adding your first parking terminal</p>
                        <Link
                            to="/addterminal"
                            className="bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
                        >
                            Add Your First Terminal
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {terminals.map((terminal) => (
                            <div key={terminal.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="h-48 bg-gray-200 relative">
                                    {terminal.profile_image_url ? (
                                        <img
                                            src={terminal.profile_image_url}
                                            alt={terminal.name}
                                            className="w-full h-48 object-cover rounded"
                                            onError={(e) => {
                                                e.currentTarget.src = '/default-image.jpg';
                                                console.warn(`Failed to load image: ${terminal.profile_image_url}`);
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{terminal.name}</h3>
                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{terminal.address || 'No address'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9" />
                                            </svg>
                                            <span>Capacity: {terminal.total_capacity} spots</span>
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            <span>{terminal.city || 'No city'}, {terminal.country || 'No country'}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
                                            Edit
                                        </button>
                                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Spterminals;