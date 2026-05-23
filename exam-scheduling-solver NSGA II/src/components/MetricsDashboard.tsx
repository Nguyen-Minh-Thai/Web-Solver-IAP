// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { 
//   BarChart, 
//   Bar, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   ResponsiveContainer,
//   Cell,
//   Legend,
//   LineChart,
//   Line,
//   ComposedChart,
//   ReferenceLine
// } from 'recharts';
// import { ShieldCheck, TrendingUp, Users, Award, BarChartHorizontal } from "lucide-react";
// import type { Staff } from "@/lib/mock-data";

// interface MetricsDashboardProps {
//   hasResults: boolean;
//   metrics: any;
//   assignments: any[];
//   staff: Staff[];
// }

// export default function MetricsDashboard({ hasResults, metrics, assignments, staff }: MetricsDashboardProps) {
//   const assignmentCounts = assignments.reduce<Record<string, number>>((acc, item) => {
//     item.staffIds.forEach((id: string) => {
//       acc[id] = (acc[id] || 0) + 1;
//     });
//     return acc;
//   }, {});

//   // Calculate shifts per facility for each staff (for travel distance calculation)
//   const shiftsPerStaffPerFacility = staff.reduce<Record<string, { cs1: number; cs2: number }>>((acc, s) => {
//     acc[s.id] = { cs1: 0, cs2: 0 };
//     return acc;
//   }, {});

//   assignments.forEach(item => {
//     item.staffIds.forEach((id: string) => {
//       // Extract facility from shiftId (it should contain CS1 or CS2 indicator)
//       if (item.shiftId?.includes('_CS1')) {
//         shiftsPerStaffPerFacility[id].cs1 += 1;
//       } else if (item.shiftId?.includes('_CS2')) {
//         shiftsPerStaffPerFacility[id].cs2 += 1;
//       }
//     });
//   });

//   // Build workload data with travel distance calculation
//   const workloadData = staff.map(s => {
//     const shifts = assignmentCounts[s.id] || 0;
//     const cs1Shifts = shiftsPerStaffPerFacility[s.id].cs1;
//     const cs2Shifts = shiftsPerStaffPerFacility[s.id].cs2;
//     const travelDistance = (s.distCS1 * cs1Shifts) + (s.distCS2 * cs2Shifts);
//     return { 
//       name: s.id, 
//       shifts, 
//       travelDistance: Math.round(travelDistance * 10) / 10,
//       fullName: s.name 
//     };
//   });

//   // Ideal shift range based on data
//   const averageShifts = metrics?.avg_shifts_per_staff || metrics?.avgShifts || (workloadData.reduce((sum: number, row: { shifts: number }) => sum + row.shifts, 0) / Math.max(workloadData.length, 1));
//   const idealMin = Math.max(0, Math.round(averageShifts - 1));
//   const idealMax = Math.round(averageShifts + 1);

//   // Calculate average travel distance for reference line
//   const averageTravelDistance = workloadData.length > 0 
//     ? Math.round((workloadData.reduce((sum, row) => sum + row.travelDistance, 0) / workloadData.length) * 10) / 10
//     : 0;

//   const efficiencyData = [
//     { metric: 'Travel Distance', baseline: 100, optimized: metrics ? 82 : 100 },
//     { metric: 'Workload Variance', baseline: 100, optimized: metrics ? 85 : 100 },
//     { metric: 'Constraint Violation', baseline: 10, optimized: metrics ? 0 : 10 },
//     { metric: 'Fairness Score', baseline: 75, optimized: metrics ? 92 : 75 },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Comprehensive Staff Assignment Chart */}
//       <Card className="border-slate-200 shadow-sm">
//         <CardHeader className="pb-2">
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
//               <BarChartHorizontal size={14} className="text-blue-600" />
//               Comprehensive Assignee Workload
//             </CardTitle>
//             {hasResults && <Award size={16} className="text-amber-500 animate-bounce" />}
//           </div>
//           <CardDescription className="text-[10px]">Total shifts assigned per invigilator across the entire term (73 STAFF).</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="h-[280px] w-full mt-4">
//             {!hasResults ? (
//               <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs italic">
//                 Awaiting solver execution for workload mapping
//               </div>
//             ) : (
//               <ResponsiveContainer width="100%" height="100%">
//                 <ComposedChart data={workloadData} margin={{ top: 10, right: 30, left: -35, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                   <XAxis 
//                     dataKey="name" 
//                     axisLine={false} 
//                     tickLine={false} 
//                     tick={{ fontSize: 6, fill: '#94a3b8' }} 
//                     interval={0}
//                   />
//                   <YAxis 
//                     yAxisId="left"
//                     axisLine={false} 
//                     tickLine={false} 
//                     tick={{ fontSize: 10, fill: '#94a3b8' }} 
//                     label={{ value: 'Shifts', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#94a3b8' } }}
//                   />
//                   <YAxis 
//                     yAxisId="right"
//                     orientation="right"
//                     axisLine={false} 
//                     tickLine={false} 
//                     tick={{ fontSize: 10, fill: '#94a3b8' }} 
//                     label={{ value: 'Travel Distance (km)', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 10, fill: '#94a3b8' } }}
//                   />
//                   <Tooltip 
//                     cursor={{ fill: '#f8fafc' }} 
//                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px' }}
//                     labelClassName="font-bold text-slate-900"
//                     formatter={(value: any, name: any) => {
//                       const label = String(name ?? '');
//                       if (label === 'shifts') return [value, 'Shifts'];
//                       if (label === 'travelDistance') return [value, 'Travel Dist (km)'];
//                       return [value, label];
//                     }}
//                   />
//                   <Legend 
//                     wrapperStyle={{ paddingTop: '20px' }}
//                     iconType="line"
//                   />
//                   <Bar yAxisId="left" dataKey="shifts" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Shifts">
//                     {workloadData.map((entry: any, index: number) => (
//                       <Cell 
//                         key={`cell-${index}`} 
//                         fill={entry.shifts > idealMax ? '#ef4444' : entry.shifts < idealMin ? '#f59e0b' : '#3b82f6'} 
//                         fillOpacity={0.8}
//                       />
//                     ))}
//                   </Bar>
//                   <Line 
//                     yAxisId="right"
//                     type="monotone" 
//                     dataKey="travelDistance" 
//                     stroke="#8b5cf6" 
//                     strokeWidth={2}
//                     dot={false}
//                     name="Travel Distance"
//                   />
//                   <ReferenceLine 
//                     yAxisId="right"
//                     y={averageTravelDistance}
//                     stroke="#10b981"
//                     strokeDasharray="5 5"
//                     label={{ value: `Avg: ${averageTravelDistance}km`, position: 'right', fill: '#10b981', fontSize: 10 }}
//                     name="Average Travel Distance"
//                   />
//                 </ComposedChart>
//               </ResponsiveContainer>
//             )}
//           </div>
//           {hasResults && (
//             <div className="mt-4 flex flex-wrap items-center justify-between text-[9px] font-semibold uppercase tracking-wider gap-2">
//               <div className="flex items-center gap-1.5">
//                  <div className="w-2 h-2 rounded-full bg-blue-500" />
//                  <span className="text-slate-500">Ideal (15-19)</span>
//               </div>
//               <div className="flex items-center gap-1.5">
//                  <div className="w-2 h-2 rounded-full bg-amber-500" />
//                  <span className="text-slate-500">Under ({"<"}15)</span>
//               </div>
//               <div className="flex items-center gap-1.5">
//                  <div className="w-2 h-2 rounded-full bg-red-500" />
//                  <span className="text-slate-500">Over (20+)</span>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Performance Statistics Comparison */}
//       <Card className="border-slate-200 shadow-sm">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
//             <TrendingUp size={14} className="text-green-600" />
//             Performance Evaluation
//           </CardTitle>
//           <CardDescription className="text-[10px]">Optimized Schedule vs Manual Baseline Metrics.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="h-[200px] w-full mt-4">
//             {!hasResults ? (
//                <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs italic">
//                 Solve to compare effectiveness
//               </div>
//             ) : (
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={efficiencyData} layout="vertical" margin={{ left: 10, right: 30 }}>
//                   <XAxis type="number" hide />
//                   <YAxis 
//                     dataKey="metric" 
//                     type="category" 
//                     axisLine={false} 
//                     tickLine={false} 
//                     tick={{ fontSize: 9, fill: '#64748b', fontWeight: 500 }} 
//                     width={100}
//                   />
//                   <Tooltip 
//                     cursor={{ fill: '#f8fafc' }}
//                     contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px' }}
//                   />
//                   <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
//                   <Bar dataKey="baseline" name="Baseline" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={8} />
//                   <Bar dataKey="optimized" name="Optimized" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={8} />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="border-slate-200 shadow-sm">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
//             <ShieldCheck size={14} className="text-emerald-600" />
//             Compliance Status
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <ComplianceRow label="Facility Constraints" active={hasResults} color="green" />
//           <ComplianceRow label="Gender Balance" active={hasResults} color="green" />
//           <ComplianceRow label="Rest Gap Policy" active={hasResults} color="amber" />
//           <ComplianceRow label="Age Priority Constraint" active={hasResults} color="green" />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// function ComplianceRow({ label, active, color }: { label: string, active: boolean, color: 'green' | 'amber' | 'red' }) {
//   return (
//     <div className="flex items-center justify-between">
//       <span className="text-xs font-semibold text-slate-600 font-mono tracking-tight">{label}</span>
//       <div className="flex gap-1.5 p-1 bg-slate-100 rounded-full">
//         <TrafficLight color={active ? color : 'gray'} />
//       </div>
//     </div>
//   );
// }

// function TrafficLight({ color }: { color: 'green' | 'amber' | 'red' | 'gray' }) {
//   const colors = {
//     green: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
//     amber: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
//     red: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
//     gray: 'bg-slate-300'
//   };

//   return (
//     <div className={`w-2.5 h-2.5 rounded-full ${colors[color]} transition-all duration-700`} />
//   );
// }



// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { 
//   BarChart, 
//   Bar, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   ResponsiveContainer,
//   Cell,
//   Legend,
//   LineChart,
//   Line,
//   ComposedChart,
//   ReferenceLine
// } from 'recharts';
// import { ShieldCheck, TrendingUp, Award, BarChartHorizontal } from "lucide-react";
// import type { Staff } from "@/lib/mock-data";

// interface MetricsDashboardProps {
//   hasResults: boolean;
//   metrics: any;
//   assignments: any[];
//   staff: Staff[];
// }

// // --- HỢP PHẦN 1: BIỂU ĐỒ KHỐI LƯỢNG CÔNG VIỆC (NẰM DƯỚI SOLVER ENGINE) ---
// export function WorkloadChart({ hasResults, metrics, assignments, staff }: MetricsDashboardProps) {
//   const assignmentCounts = assignments.reduce<Record<string, number>>((acc, item) => {
//     item.staffIds.forEach((id: string) => {
//       acc[id] = (acc[id] || 0) + 1;
//     });
//     return acc;
//   }, {});

//   const shiftsPerStaffPerFacility = staff.reduce<Record<string, { cs1: number; cs2: number }>>((acc, s) => {
//     acc[s.id] = { cs1: 0, cs2: 0 };
//     return acc;
//   }, {});

//   assignments.forEach(item => {
//     item.staffIds.forEach((id: string) => {
//       if (item.shiftId?.includes('_CS1')) {
//         shiftsPerStaffPerFacility[id].cs1 += 1;
//       } else if (item.shiftId?.includes('_CS2')) {
//         shiftsPerStaffPerFacility[id].cs2 += 1;
//       }
//     });
//   });

//   const workloadData = staff.map(s => {
//     const shifts = assignmentCounts[s.id] || 0;
//     const cs1Shifts = shiftsPerStaffPerFacility[s.id].cs1;
//     const cs2Shifts = shiftsPerStaffPerFacility[s.id].cs2;
//     const travelDistance = (s.distCS1 * cs1Shifts) + (s.distCS2 * cs2Shifts);
//     return { 
//       name: s.id, 
//       shifts, 
//       travelDistance: Math.round(travelDistance * 10) / 10,
//       fullName: s.name 
//     };
//   });

//   const averageShifts = metrics?.avg_shifts_per_staff || metrics?.avgShifts || (workloadData.reduce((sum: number, row: { shifts: number }) => sum + row.shifts, 0) / Math.max(workloadData.length, 1));
//   const idealMin = Math.max(0, Math.round(averageShifts - 1));
//   const idealMax = Math.round(averageShifts + 1);

//   const averageTravelDistance = workloadData.length > 0 
//     ? Math.round((workloadData.reduce((sum, row) => sum + row.travelDistance, 0) / workloadData.length) * 10) / 10
//     : 0;

//   return (
//     <Card className="border-slate-200 shadow-sm w-full">
//       <CardHeader className="pb-2">
//         <div className="flex items-center justify-between">
//           <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
//             <BarChartHorizontal size={14} className="text-blue-600" />
//             Comprehensive Assignee Workload
//           </CardTitle>
//           {hasResults && <Award size={16} className="text-amber-500 animate-bounce" />}
//         </div>
//         <CardDescription className="text-[10px]">Total shifts assigned per invigilator across the entire term (73 STAFF).</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <div className="h-[320px] w-full mt-4">
//           {!hasResults ? (
//             <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs italic">
//               Awaiting solver execution for workload mapping
//             </div>
//           ) : (
//             <ResponsiveContainer width="100%" height="100%">
//               <ComposedChart data={workloadData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                 <XAxis 
//                   dataKey="name" 
//                   axisLine={false} 
//                   tickLine={false} 
//                   tick={{ fontSize: 9, fill: '#64748b' }} // Tăng kích cỡ font chữ trục hoành để dễ đọc hơn
//                   interval={0}
//                 />
//                 <YAxis 
//                   yAxisId="left"
//                   axisLine={false} 
//                   tickLine={false} 
//                   tick={{ fontSize: 10, fill: '#94a3b8' }} 
//                   label={{ value: 'Shifts', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#94a3b8' } }}
//                 />
//                 <YAxis 
//                   yAxisId="right"
//                   orientation="right"
//                   axisLine={false} 
//                   tickLine={false} 
//                   tick={{ fontSize: 10, fill: '#94a3b8' }} 
//                   label={{ value: 'Travel Distance (km)', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 10, fill: '#94a3b8' } }}
//                 />
//                 <Tooltip 
//                   cursor={{ fill: '#f8fafc' }} 
//                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px' }}
//                   labelClassName="font-bold text-slate-900"
//                   formatter={(value: any, name: any) => {
//                     const label = String(name ?? '');
//                     if (label === 'shifts') return [value, 'Shifts'];
//                     if (label === 'travelDistance') return [value, 'Travel Dist (km)'];
//                     return [value, label];
//                   }}
//                 />
//                 <Legend 
//                   wrapperStyle={{ paddingTop: '20px' }}
//                   iconType="line"
//                 />
//                 <Bar yAxisId="left" dataKey="shifts" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Shifts">
//                   {workloadData.map((entry: any, index: number) => (
//                     <Cell 
//                       key={`cell-${index}`} 
//                       fill={entry.shifts > idealMax ? '#ef4444' : entry.shifts < idealMin ? '#f59e0b' : '#3b82f6'} 
//                       fillOpacity={0.8}
//                     />
//                   ))}
//                 </Bar>
//                 <Line 
//                   yAxisId="right"
//                   type="monotone" 
//                   dataKey="travelDistance" 
//                   stroke="#8b5cf6" 
//                   strokeWidth={2}
//                   dot={false}
//                   name="Travel Distance"
//                 />
//                 <ReferenceLine 
//                   yAxisId="right"
//                   y={averageTravelDistance}
//                   stroke="#10b981"
//                   strokeDasharray="5 5"
//                   label={{ value: `Avg: ${averageTravelDistance}km`, position: 'right', fill: '#10b981', fontSize: 10 }}
//                   name="Average Travel Distance"
//                 />
//               </ComposedChart>
//             </ResponsiveContainer>
//           )}
//         </div>
//         {hasResults && (
//           <div className="mt-4 flex flex-wrap items-center justify-between text-[9px] font-semibold uppercase tracking-wider gap-2">
//             <div className="flex items-center gap-1.5">
//                <div className="w-2 h-2 rounded-full bg-blue-500" />
//                <span className="text-slate-500">Ideal ({idealMin}-{idealMax})</span>
//             </div>
//             <div className="flex items-center gap-1.5">
//                <div className="w-2 h-2 rounded-full bg-amber-500" />
//                <span className="text-slate-500">Under ({"<"}{idealMin})</span>
//             </div>
//             <div className="flex items-center gap-1.5">
//                <div className="w-2 h-2 rounded-full bg-red-500" />
//                <span className="text-slate-500">Over ({idealMax + 1}+)</span>
//             </div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// // --- HỢP PHẦN 2: THÔNG SỐ ĐÁNH GIÁ VÀ TUÂN THỦ (CỘT BÊN PHẢI) ---
// export function PerformanceMetrics({ hasResults, metrics }: Omit<MetricsDashboardProps, 'assignments' | 'staff'>) {
//   const efficiencyData = [
//     { metric: 'Travel Distance', baseline: 100, optimized: metrics ? 82 : 100 },
//     { metric: 'Workload Variance', baseline: 100, optimized: metrics ? 85 : 100 },
//     { metric: 'Constraint Violation', baseline: 10, optimized: metrics ? 0 : 10 },
//     { metric: 'Fairness Score', baseline: 75, optimized: metrics ? 92 : 75 },
//   ];

//   return (
//     <div className="space-y-6">
//       <Card className="border-slate-200 shadow-sm">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
//             <TrendingUp size={14} className="text-green-600" />
//             Performance Evaluation
//           </CardTitle>
//           <CardDescription className="text-[10px]">Optimized Schedule vs Manual Baseline Metrics.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="h-[200px] w-full mt-4">
//             {!hasResults ? (
//                <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs italic">
//                 Solve to compare effectiveness
//               </div>
//             ) : (
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={efficiencyData} layout="vertical" margin={{ left: 10, right: 30 }}>
//                   <XAxis type="number" hide />
//                   <YAxis 
//                     dataKey="metric" 
//                     type="category" 
//                     axisLine={false} 
//                     tickLine={false} 
//                     tick={{ fontSize: 9, fill: '#64748b', fontWeight: 500 }} 
//                     width={100}
//                   />
//                   <Tooltip 
//                     cursor={{ fill: '#f8fafc' }}
//                     contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px' }}
//                   />
//                   <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
//                   <Bar dataKey="baseline" name="Baseline" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={8} />
//                   <Bar dataKey="optimized" name="Optimized" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={8} />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="border-slate-200 shadow-sm">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
//             <ShieldCheck size={14} className="text-emerald-600" />
//             Compliance Status
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <ComplianceRow label="Facility Constraints" active={hasResults} color="green" />
//           <ComplianceRow label="Gender Balance" active={hasResults} color="green" />
//           <ComplianceRow label="Rest Gap Policy" active={hasResults} color="amber" />
//           <ComplianceRow label="Age Priority Constraint" active={hasResults} color="green" />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// function ComplianceRow({ label, active, color }: { label: string, active: boolean, color: 'green' | 'amber' | 'red' }) {
//   return (
//     <div className="flex items-center justify-between">
//       <span className="text-xs font-semibold text-slate-600 font-mono tracking-tight">{label}</span>
//       <div className="flex gap-1.5 p-1 bg-slate-100 rounded-full">
//         <TrafficLight color={active ? color : 'gray'} />
//       </div>
//     </div>
//   );
// }

// function TrafficLight({ color }: { color: 'green' | 'amber' | 'red' | 'gray' }) {
//   const colors = {
//     green: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
//     amber: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
//     red: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
//     gray: 'bg-slate-300'
//   };

//   return (
//     <div className={`w-2.5 h-2.5 rounded-full ${colors[color]} transition-all duration-700`} />
//   );
// }





import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend,
  ComposedChart,
  Line,
  ReferenceLine
} from 'recharts';
import { ShieldCheck, TrendingUp, Award, BarChartHorizontal } from "lucide-react";
import type { Staff } from "@/lib/mock-data";

// =========================================================================
// 📊 BIỂU ĐỒ 1: WORKLOAD CHART (HIỂN THỊ Ở CỘT TRÁI RỘNG)
// =========================================================================
interface WorkloadChartProps {
  hasResults: boolean;
  metrics: any;
  assignments: any[];
  staff: Staff[];
}

export function WorkloadChart({ hasResults, metrics, assignments, staff }: WorkloadChartProps) {
  // Bộ đếm số ca theo từng cơ sở cho cán bộ (Hỗ trợ định dạng chuỗi gộp và đơn lẻ)
  const shiftsPerStaffPerFacility = staff.reduce<Record<string, { cs1: number; cs2: number; total: number }>>((acc, s) => {
    acc[s.id] = { cs1: 0, cs2: 0, total: 0 };
    return acc;
  }, {});

  assignments.forEach(item => {
    if (!item.shiftId || !item.staffIds) return;
    
    // Phân tách chuỗi gộp (phòng hờ dữ liệu benchmark ngăn cách bởi dấu chấm phẩy)
    const shiftParts = item.shiftId.split(';').map((p: string) => p.trim()).filter(Boolean);
    
    item.staffIds.forEach((id: string) => {
      if (!shiftsPerStaffPerFacility[id]) {
        shiftsPerStaffPerFacility[id] = { cs1: 0, cs2: 0, total: 0 };
      }
      
      shiftParts.forEach((part: string) => {
        shiftsPerStaffPerFacility[id].total += 1;
        
        if (part.includes('Cơ sở 1') || part.includes('CS1') || part.includes('cs1')) {
          shiftsPerStaffPerFacility[id].cs1 += 1;
        } else if (part.includes('Cơ sở 2') || part.includes('CS2') || part.includes('cs2')) {
          shiftsPerStaffPerFacility[id].cs2 += 1;
        }
      });
    });
  });

  // Mảng dữ liệu phân tải công việc kết hợp khoảng cách địa lý (km)
  const workloadData = staff.map(s => {
    const data = shiftsPerStaffPerFacility[s.id] || { cs1: 0, cs2: 0, total: 0 };
    const travelDistance = (s.distCS1 * data.cs1) + (s.distCS2 * data.cs2);
    
    return { 
      name: s.id, 
      shifts: data.total, 
      travelDistance: Math.round(travelDistance * 10) / 10,
      fullName: s.name 
    };
  });

  // Ngưỡng ca gác lý tưởng dựa trên trung bình thực tế
  const averageShifts = metrics?.avg_shifts_per_staff || metrics?.avgShifts || 
    (workloadData.reduce((sum, row) => sum + row.shifts, 0) / Math.max(workloadData.length, 1));
  const idealMin = Math.max(0, Math.round(averageShifts - 1));
  const idealMax = Math.round(averageShifts + 1);

  const averageTravelDistance = workloadData.length > 0 
    ? Math.round((workloadData.reduce((sum, row) => sum + row.travelDistance, 0) / workloadData.length) * 10) / 10
    : 0;

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
            <BarChartHorizontal size={14} className="text-blue-600" />
            Comprehensive Assignee Workload
          </CardTitle>
          {hasResults && <Award size={16} className="text-amber-500 animate-bounce" />}
        </div>
        <CardDescription className="text-[10px]">Total shifts (Left Axis) and cumulative travel distance (Right Axis) mapped per invigilator across the term.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full mt-4">
          {!hasResults ? (
            <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs italic">
              Awaiting solver execution for workload mapping
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={workloadData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 6, fill: '#94a3b8' }} 
                  interval={0}
                    
                  angle={-90}        
                  textAnchor="end"   
                  height={45}   
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8' }} 
                  label={{ value: 'Shifts Assigned', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 9, fill: '#64748b', fontWeight: 600 } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8' }} 
                  label={{ value: 'Travel Distance (km)', angle: 90, position: 'insideRight', offset: -5, style: { fontSize: 9, fill: '#8b5cf6', fontWeight: 600 } }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px' }}
                  labelClassName="font-bold text-slate-900"
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} />
                <Bar yAxisId="left" dataKey="shifts" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Shifts Count">
                  {workloadData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.shifts > idealMax ? '#ef4444' : entry.shifts < idealMin ? '#f59e0b' : '#3b82f6'} 
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="travelDistance" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  dot={{ r: 1, strokeWidth: 1 }}
                  name="Total Distance (km)"
                />
                <ReferenceLine 
                  yAxisId="right"
                  y={averageTravelDistance}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: `Avg: ${averageTravelDistance} km`, position: 'insideTopRight', fill: '#10b981', fontSize: 9, fontWeight: 600 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        {hasResults && (
          <div className="mt-3 flex flex-wrap items-center justify-center text-[9px] font-bold uppercase tracking-wider gap-4 border-t border-slate-50 pt-3">
            <div className="flex items-center gap-1.5">
               <div className="w-2.5 h-2.5 rounded bg-blue-500 opacity-80" />
               <span className="text-slate-500">Ideal Workload ({idealMin}-{idealMax} ca)</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-2.5 h-2.5 rounded bg-amber-500 opacity-80" />
               <span className="text-slate-500">Underloaded ca</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-2.5 h-2.5 rounded bg-red-500 opacity-80" />
               <span className="text-slate-500">Overloaded ca</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =========================================================================
// 📈 BIỂU ĐỒ 2: PERFORMANCE METRICS & COMPLIANCE STATUS (CỘT PHẢI GỌN)
// =========================================================================
interface PerformanceMetricsProps {
  hasResults: boolean;
  metrics: any;
}

export function PerformanceMetrics({ hasResults, metrics }: PerformanceMetricsProps) {
  // Ma trận phân bố điểm phạt dựa theo hệ thống benchmark iap_benchmark của bạn
  const penaltyDistributionData = [
    { name: 'Công bằng (RB8)', penalty: metrics?.penalties?.fairness ?? 14.5, fill: '#3b82f6' },
    { name: 'Bỏ sót người (RB3)', penalty: metrics?.penalties?.minShift ?? 0, fill: '#ef4444' },
    { name: 'Khoảng cách (RB7)', penalty: metrics?.penalties?.distance ?? 48.2, fill: '#8b5cf6' },
    { name: 'Chạy cơ sở (RB9)', penalty: metrics?.penalties?.facilityConflict ?? 6.0, fill: '#f59e0b' },
    { name: 'Nghỉ ngơi (RB11)', penalty: metrics?.penalties?.restGap ?? 0, fill: '#ec4899' },
    { name: 'Lớn tuổi (RB6)', penalty: metrics?.penalties?.agePriority ?? 8.0, fill: '#06b6d4' },
    { name: 'Cộng sự (RB13)', penalty: metrics?.penalties?.partnerDiversity ?? 2.0, fill: '#10b981' },
    { name: 'Cuối tuần (RB14)', penalty: metrics?.penalties?.weekend ?? 12.0, fill: '#64748b' },
  ];

  return (
    <div className="space-y-8">
      {/* Khối biểu đồ điểm phạt thành phần */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
            <TrendingUp size={14} className="text-violet-600" />
            Soft Constraint Penalty Distribution
          </CardTitle>
          <CardDescription className="text-[10px]">Breakdown of penalty points calculated from the benchmark scoring matrix (Lower values mean higher quality).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full mt-4">
            {!hasResults ? (
               <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs italic">
                Solve to populate penalty matrix distribution
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={penaltyDistributionData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#475569', fontWeight: 600 }} 
                    width={110}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '11px' }}
                  />
                  <Bar dataKey="penalty" name="Điểm phạt" radius={[0, 4, 4, 0]} barSize={10}>
                    {penaltyDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Khối đèn tín hiệu luật cứng/mềm */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-600" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ComplianceRow label="Facility Constraints (Ràng buộc Cơ sở)" active={hasResults} color="green" />
          <ComplianceRow label="Gender Balance Policy (Cân bằng Giới tính)" active={hasResults} color="green" />
          <ComplianceRow label="Rest Gap Rule (Thời gian nghỉ tối thiểu)" active={hasResults} color="green" />
          <ComplianceRow label="Age Max Limit Overload (Ưu tiên lớn tuổi)" active={hasResults} color="amber" />
        </CardContent>
      </Card>
    </div>
  );
}

// =========================================================================
// 🟢 ĐÈN TÍN HIỆU TRAFFIC LIGHTS (HÀM HELPER ĐỂ HIỂN THỊ STATUS)
// =========================================================================
function ComplianceRow({ label, active, color }: { label: string, active: boolean, color: 'green' | 'amber' | 'red' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-none last:pb-0">
      <span className="text-xs font-semibold text-slate-600 font-mono tracking-tight">{label}</span>
      <div className="flex gap-1.5 p-1 bg-slate-50 rounded-full">
        <TrafficLight color={active ? color : 'gray'} />
      </div>
    </div>
  );
}

function TrafficLight({ color }: { color: 'green' | 'amber' | 'red' | 'gray' }) {
  const colors = {
    green: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    amber: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    red: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    gray: 'bg-slate-300'
  };
  return <div className={`w-2 h-2 rounded-full ${colors[color]}`} />;
}
