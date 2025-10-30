import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SoftwareComponent, User } from '../types';

interface OverviewProps {
    user: User;
}

const Overview: React.FC<OverviewProps> = ({ user }) => {
    const router = useRouter();
    const [components, setComponents] = useState<SoftwareComponent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComponents = async () => {
            try {
                const response = await fetch('/api/components');
                if (response.ok) {
                    const data = await response.json();
                    setComponents(data);
                }
            } catch (error) {
                console.error('Error fetching components:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchComponents();
    }, []);

    const totalServices = components.length;
    const infrastructureCount = components.filter(c => c.type === 'Infrastructure').length;
    const activeCount = components.filter(c => c.terraformStatus === 'applied').length;
    const deployingCount = components.filter(c => ['planning', 'applying', 'apply_queued'].includes(c.terraformStatus || '')).length;

    // Chart data
    const trafficData = [
        { date: 'Jan 01', website: 120, social: 8 },
        { date: 'Jan 02', website: 180, social: 12 },
        { date: 'Jan 03', website: 150, social: 10 },
        { date: 'Jan 04', website: 220, social: 15 },
        { date: 'Jan 05', website: 250, social: 18 },
        { date: 'Jan 06', website: 200, social: 14 },
        { date: 'Jan 07', website: 280, social: 20 },
    ];

    const incomeData = [
        { name: 'Target', value: 75 },
        { name: 'Remaining', value: 25 },
    ];

    const categoryData = [
        { name: 'Infrastructure', value: infrastructureCount },
        { name: 'Services', value: components.filter(c => c.type === 'Service').length },
    ];

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
           <div className="flex-1 overflow-y-auto bg-lt-base-100 dark:bg-base-100">
            <div className="p-6">
                {/* Dashboard Header */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 text-sm text-lt-content-subtle dark:text-gray-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span>Dashboards / Overview</span>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">?</span>
                    </div>
                    <p className="text-sm text-blue-800">This dashboard displays your deployed services and infrastructure components across all environments.</p>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-4 gap-6 mb-6">
                    <div className="bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-sm p-6 border border-lt-base-300 dark:border-base-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-lt-content-subtle dark:text-gray-400">TOTAL SERVICES</h3>
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">{totalServices}</span>
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-xs text-green-600 font-semibold">▲ {Math.floor(Math.random() * 50)}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-sm p-6 border border-lt-base-300 dark:border-base-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-lt-content-subtle dark:text-gray-400">INFRASTRUCTURE</h3>
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">{infrastructureCount}</span>
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-xs text-red-600 font-semibold">▼ {Math.floor(Math.random() * 30)}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-sm p-6 border border-lt-base-300 dark:border-base-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-lt-content-subtle dark:text-gray-400">COMPANY ASSETS</h3>
                            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">{Math.floor(totalServices * 1.2)}</span>
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-sm font-semibold text-lt-content-strong dark:text-white">$ {Math.floor(totalServices * 12.5)}K</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-sm p-6 border border-lt-base-300 dark:border-base-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-lt-content-subtle dark:text-gray-400">ACTIVE SERVICES</h3>
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">{activeCount}</span>
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-semibold">+ {activeCount} active</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Traffic Sources Chart */}
                    <div className="col-span-2 bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-sm p-6 border border-lt-base-300 dark:border-base-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-lt-content-strong dark:text-white">Deployment Activity</h3>
                            <button className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-semibold rounded hover:bg-yellow-600 transition">
                                Actions
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={trafficData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="website" fill="#3B82F6" name="Website Blog" />
                                <Line yAxisId="right" type="monotone" dataKey="social" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Social Media" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Income/Deployment Chart */}
                    <div className="bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-sm p-6 border border-lt-base-300 dark:border-base-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-lt-content-strong dark:text-white">Deployment Status</h3>
                            <div className="flex items-center space-x-2">
                                <button className="p-1 hover:bg-lt-base-300 dark:hover:bg-base-300 rounded">
                                    <svg className="w-4 h-4 text-lt-content-subtle dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <button className="p-1 hover:bg-lt-base-300 dark:hover:bg-base-300 rounded">
                                    <svg className="w-4 h-4 text-lt-content-subtle dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={incomeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {incomeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#E5E7EB'} />
                                    ))}
                                </Pie>
                                <text x="50%" y="45%" textAnchor="middle" fill="#6B7280" className="text-2xl font-bold">
                                    75
                                </text>
                                <text x="50%" y="55%" textAnchor="middle" fill="#9CA3AF" className="text-sm">
                                    Percent
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-lt-content-subtle dark:text-gray-400">32%</span>
                                <span className="text-sm font-medium text-lt-content-strong dark:text-white">Deployments Target</span>
                            </div>
                            <div className="w-full bg-lt-base-300 dark:bg-base-300 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Latest Deployments Card */}
                <div className="bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-sm p-6 border border-lt-base-300 dark:border-base-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-lt-content-strong dark:text-white">Latest Deployments</h3>
                        <a href="/dashboard?tab=my-services" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View All →
                        </a>
                    </div>
                    <div className="space-y-3">
                        {components.slice(0, 5).map((component) => {
                            const handleClick = () => {
                                router.push(`/component/${component.id}`);
                            };

                            const getStatusColor = () => {
                                switch (component.terraformStatus) {
                                    case 'applied':
                                        return 'bg-green-100 text-green-800';
                                    case 'applying':
                                    case 'planning':
                                        return 'bg-blue-100 text-blue-800';
                                    case 'errored':
                                        return 'bg-red-100 text-red-800';
                                    default:
                                        return 'bg-yellow-100 text-yellow-800';
                                }
                            };

                            const getStatusText = () => {
                                switch (component.terraformStatus) {
                                    case 'applied':
                                        return 'Active';
                                    case 'applying':
                                        return 'Deploying';
                                    case 'planning':
                                        return 'Planning';
                                    case 'errored':
                                        return 'Failed';
                                    default:
                                        return 'Pending';
                                }
                            };

                            const getLifecycleColor = () => {
                                switch (component.lifecycle) {
                                    case 'Production':
                                        return 'bg-red-500';
                                    case 'Staging':
                                        return 'bg-orange-500';
                                    default:
                                        return 'bg-blue-500';
                                }
                            };

                            return (
                                <button
                                    key={component.id}
                                    onClick={handleClick}
                                    className="w-full group flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                                >
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100">
                                            {(() => {
                                                // Check if it's a GCP bucket
                                                if (component.githubUrl && component.githubUrl.includes('console.cloud.google.com')) {
                                                    return (
                                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                                        </svg>
                                                    );
                                                }
                                                // Default infrastructure icon
                                                return (
                                                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h4 className="font-semibold text-lt-content-strong dark:text-white group-hover:text-blue-600 transition-colors truncate">
                                                    {component.name}
                                                </h4>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getLifecycleColor()} text-white`}>
                                                    {component.lifecycle}
                                                </span>
                                            </div>
                                            <p className="text-sm text-lt-content dark:text-gray-400 truncate text-left">
                                                {component.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 ml-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}>
                                            {getStatusText()}
                                        </span>
                                        <svg className="w-4 h-4 text-lt-content-subtle dark:text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            );
                        })}
                        {components.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 mx-auto mb-3 bg-lt-base-300 dark:bg-base-300 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-lt-content-subtle dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-lt-content dark:text-gray-400 text-sm">No deployments yet</p>
                                <p className="text-lt-content-subtle dark:text-gray-500 text-xs mt-1">Create your first service to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
