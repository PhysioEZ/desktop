import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, CreditCard } from 'lucide-react';
import './RevenueAnalytics.css';

interface RevenueAnalyticsProps {
    data?: {
        dailyRevenue?: { date: string, amount: number }[];
        paymentMethods?: { name: string, value: number }[];
    };
    isDark?: boolean;
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ data, isDark }) => {
    // Mock data if none provided
    const dailyData = data?.dailyRevenue || [
        { date: '01 Feb', amount: 12500 },
        { date: '05 Feb', amount: 18400 },
        { date: '10 Feb', amount: 14200 },
        { date: '15 Feb', amount: 22800 },
        { date: '20 Feb', amount: 19500 },
        { date: '25 Feb', amount: 28400 },
        { date: '28 Feb', amount: 32000 },
    ];

    const pieData = data?.paymentMethods || [
        { name: 'Cash', value: 45000 },
        { name: 'UPI', value: 32000 },
        { name: 'Insurance', value: 15000 },
        { name: 'Online', value: 8000 },
    ];

    const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-chart-tooltip">
                    <p className="tooltip-label">{label}</p>
                    <p className="tooltip-value">₹{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="revenue-analytics-container">
            {/* LINE CHART: Daily Revenue Trend */}
            <div className="analytics-card">
                <div className="analytics-card-header">
                    <h3 className="analytics-card-title">
                        <TrendingUp size={14} className="text-emerald-500" />
                        Daily Revenue Trend
                    </h3>
                </div>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                tickFormatter={(val) => `₹${val / 1000}k`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 2 }} />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRev)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PIE CHART: Payment Distribution */}
            <div className="analytics-card">
                <div className="analytics-card-header">
                    <h3 className="analytics-card-title">
                        <CreditCard size={14} className="text-indigo-500" />
                        Payment Methods
                    </h3>
                </div>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                                animationBegin={500}
                                animationDuration={1500}
                            >
                                {pieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="custom-legend">
                    {pieData.map((entry, index) => (
                        <div key={index} className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            {entry.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RevenueAnalytics;
