import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SoftwareComponent, User } from '../types';

interface OverviewProps {
    user: User;
}

const Overview: React.FC<OverviewProps> = ({ user }) => {
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

    // Calculate statistics
    const totalServices = components.length;
    const infrastructureCount = components.filter(c => c.type === 'Infrastructure').length;
    const serviceCount = components.filter(c => c.type === 'Service').length;
    const websiteCount = components.filter(c => c.type === 'Website').length;
    
    // Environment breakdown
    const prodCount = components.filter(c => c.lifecycle === 'Production').length;
    const stgCount = components.filter(c => c.lifecycle === 'Staging').length;
    const devCount = components.filter(c => c.lifecycle === 'Development').length;
    
    // Active vs Inactive
    const activeCount = components.filter(c => c.terraformStatus === 'applied').length;
    const deployingCount = components.filter(c => ['planning', 'applying', 'apply_queued'].includes(c.terraformStatus || '')).length;
    const failedCount = components.filter(c => c.terraformStatus === 'errored').length;
    
    // Deployment trend data (last 6 months)
    const trendData = [
        { name: 'Oct', infra: 5, services: 8 },
        { name: 'Nov', infra: 8, services: 10 },
        { name: 'Dec', infra: 6, services: 12 },
        { name: 'Jan', infra: 10, services: 15 },
        { name: 'Feb', infra: 12, services: 18 },
        { name: 'Mar', infra: 8, services: 22 },
    ];

    // Services by category
    const categoryData = [
        { name: 'Infrastructure', value: infrastructureCount },
        { name: 'Services', value: serviceCount },
    ];

    // Environment distribution
    const environmentData = [
        { name: 'Production', value: prodCount },
        { name: 'Staging', value: stgCount },
        { name: 'Development', value: devCount },
    ];

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    const COLORS = ['#8B5CF6', '#10B981', '#F59E0B'];
    const ENV_COLORS = ['#EF4444', '#F59E0B', '#10B981'];

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Overview</h1>
                    <p className="text-sm text-slate-600">Monitor your infrastructure and services</p>
                </div>

                {/* Compact Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Total Services</p>
                                <p className="text-2xl font-bold text-slate-800">{totalServices}</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Infrastructure</p>
                                <p className="text-2xl font-bold text-slate-800">{infrastructureCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Active</p>
                                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Deploying</p>
                                <p className="text-2xl font-bold text-blue-600">{deployingCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Deployment Trend */}
                    <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Deployment Trend</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Bar dataKey="infra" stackId="a" fill="#8B5CF6" />
                                <Bar dataKey="services" stackId="a" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Services by Category */}
                    <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Services by Category</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={categoryData.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.filter(d => d.value > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Environment Distribution */}
                    <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Environment Distribution</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={environmentData.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {environmentData.filter(d => d.value > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={ENV_COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Service Status */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Service Status</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-slate-700">Active</span>
                                </div>
                                <span className="text-lg font-bold text-slate-800">{activeCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-slate-700">Deploying</span>
                                </div>
                                <span className="text-lg font-bold text-slate-800">{deployingCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm text-slate-700">Failed</span>
                                </div>
                                <span className="text-lg font-bold text-slate-800">{failedCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Deployments */}
                    <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200 col-span-2">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Deployments</h3>
                        <div className="space-y-2">
                            {components.slice(0, 6).map((component, index) => (
                                <div key={component.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
                                            <span className="text-xs font-bold">
                                                {component.type === 'Infrastructure' ? '🏗️' :
                                                 component.type === 'Service' ? '⚙️' :
                                                 '🌐'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">{component.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{component.description}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        component.terraformStatus === 'applied' ? 'bg-green-100 text-green-800' :
                                        component.terraformStatus === 'applying' ? 'bg-blue-100 text-blue-800' :
                                        component.terraformStatus === 'errored' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {component.terraformStatus === 'applied' ? 'Active' :
                                         component.terraformStatus === 'applying' ? 'Deploying' :
                                         component.terraformStatus === 'errored' ? 'Failed' :
                                         'Pending'}
                                    </span>
                                </div>
                            ))}
                            {components.length === 0 && (
                                <p className="text-center text-xs text-slate-500 py-4">No deployments yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
