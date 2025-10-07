import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
interface Terminal {
    id: number;
    name: string;
    address: string;
    total_capacity: number;
    city: string;
    country: string;
    profile_image_url: string | null;
}

interface CsrfResponse {
    csrfToken: string;
}

function Spterminals() {
    const [terminals, setTerminals] = useState<Terminal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const setupAxios = async () => {
            try {
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
            setTerminals(response.data);
        } catch (err: any) {
            console.error('Error fetching terminals:', err);
            setError('Failed to fetch terminals. Ensure you are logged in as a Service Provider.');
        } finally {
            setLoading(false);
        }
    };

    const handleTerminalClick = (terminalId: number) => {
        navigate(`/terminal/${terminalId}/spots`);
    };

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
        <div className="min-h-screen bg-gray-50 py-40 px-4 sm:px-6 lg:px-8 ">
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {terminals.map((terminal) => (
                            <div
                                key={terminal.id}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                                onClick={() => handleTerminalClick(terminal.id)}
                            >
                                {/* Image */}
                                <div className="w-full h-56 relative">
                                    <img
                                        src={terminal.profile_image_url || "/default-image.jpg"}
                                        alt={terminal.name}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            e.currentTarget.src = "/default-image.jpg";
                                        }}
                                    />
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                        <span className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            View Spots
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex justify-between items-center p-6 bg-gray-50 group-hover:bg-gray-100 transition-colors duration-300">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-black transition-colors duration-300">
                                            {terminal.name}
                                        </h2>
                                        <p className="text-gray-600 text-sm mt-1">
                                            {terminal.address || "No address"}, {terminal.city || "No city"}
                                        </p>
                                        <p className="text-gray-600 text-sm mt-1">
                                            Capacity: {terminal.total_capacity} cars
                                        </p>
                                    </div>

                                    <div className="bg-black text-white px-5 py-2 rounded-full text-sm group-hover:bg-gray-800 transition-colors duration-300">
                                        Visit us
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