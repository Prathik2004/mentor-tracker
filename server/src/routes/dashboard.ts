import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Class from '../models/Class';
import Incentive from '../models/Incentive';
import Payment from '../models/Payment';
import { calculateClassPayment } from '../utils/paymentCalculator';

const router = Router();

// GET /stats/:month - Full dashboard stats for a given month
router.get('/stats/:month', async (req: Request, res: Response) => {
  try {
    const { month } = req.params; // "2026-08" format
    const monthStr = String(month);

    // Parse month for date calculations
    const [year, monthNum] = monthStr.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Today boundaries
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // This week boundaries (Monday-Sunday)
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() + mondayOffset);
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);

    // Last week boundaries
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const baseFilter = { classMonth: monthStr, deletedAt: null };

    // Run multiple aggregations in parallel
    const [
      classEarningsResult,
      incentiveEarningsResult,
      totalClassesResult,
      uniqueStudentsResult,
      classBreakdownResult,
      earningsByTypeResult,
      legacyPtmClasses,
      noShowEarningsResult,
      statusBreakdownResult,
      schedulingBreakdownResult,
      recentClasses,
      todayClassesResult,
      todayEarningsResult,
      paymentStatus,
      thisWeekStatsResult,
      lastWeekStatsResult,
      topStudentsByCountResult,
      topStudentsByEarningsResult,
    ] = await Promise.all([
      // Class earnings
      Class.aggregate([
        { $match: baseFilter },
        { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
      ]),

      // Incentive earnings
      Incentive.aggregate([
        { $match: { month: monthStr } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Total classes count
      Class.countDocuments(baseFilter),

      // Unique students (exclude null — demo classes have no student)
      Class.distinct('studentId', { ...baseFilter, studentId: { $ne: null } }),

      // Class breakdown by type
      Class.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$classType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Earnings by class type
      Class.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$classType',
            total: { $sum: '$paymentAmount' },
            regularTotal: {
              $sum: {
                $cond: [
                  { $eq: ['$classType', 'ptm'] },
                  { $ifNull: ['$regularPaymentAmount', 0] },
                  '$paymentAmount'
                ]
              }
            },
            ptmTotal: {
              $sum: {
                $cond: [
                  { $eq: ['$classType', 'ptm'] },
                  { $ifNull: ['$ptmPaymentAmount', '$paymentAmount'] },
                  0
                ]
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]),

      Class.find({
        ...baseFilter,
        classType: 'ptm',
        regularPaymentAmount: { $exists: false },
      }).select('date status').lean(),

      // No-show earnings total
      Class.aggregate([
        { $match: { ...baseFilter, status: 'student_no_show' } },
        { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
      ]),

      // Status breakdown
      Class.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Scheduling breakdown
      Class.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$schedulingType', count: { $sum: 1 } } }
      ]),

      // Recent 10 classes for this month
      Class.find(baseFilter)
        .populate('studentId', 'name course')
        .sort({ date: -1, createdAt: -1 })
        .limit(10)
        .lean(),

      // Today's classes
      Class.find({
        deletedAt: null,
        date: { $gte: todayStart, $lte: todayEnd }
      })
        .populate('studentId', 'name course')
        .sort({ date: 1 })
        .lean(),

      // Today's earnings
      Class.aggregate([
        { $match: { deletedAt: null, date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
      ]),

      // Payment status for this month
      Payment.findOne({ earningMonth: monthStr }).lean(),

      // This week stats
      Class.aggregate([
        { $match: { deletedAt: null, date: { $gte: thisWeekStart, $lte: thisWeekEnd } } },
        {
          $group: {
            _id: null,
            classes: { $sum: 1 },
            earnings: { $sum: '$paymentAmount' },
            students: { $addToSet: '$studentId' }
          }
        }
      ]),

      // Last week stats
      Class.aggregate([
        { $match: { deletedAt: null, date: { $gte: lastWeekStart, $lte: lastWeekEnd } } },
        {
          $group: {
            _id: null,
            classes: { $sum: 1 },
            earnings: { $sum: '$paymentAmount' },
            students: { $addToSet: '$studentId' }
          }
        }
      ]),

      // Top students by class count
      Class.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$studentId', classCount: { $sum: 1 }, earnings: { $sum: '$paymentAmount' } } },
        { $sort: { classCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'students',
            localField: '_id',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' },
        {
          $project: {
            _id: 1,
            classCount: 1,
            earnings: 1,
            studentName: '$student.name',
            course: '$student.course'
          }
        }
      ]),

      // Top students by earnings
      Class.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$studentId', classCount: { $sum: 1 }, earnings: { $sum: '$paymentAmount' } } },
        { $sort: { earnings: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'students',
            localField: '_id',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' },
        {
          $project: {
            _id: 1,
            classCount: 1,
            earnings: 1,
            studentName: '$student.name',
            course: '$student.course'
          }
        }
      ]),
    ]);

    // Process results
    const classEarnings = classEarningsResult[0]?.total ?? 0;
    const incentiveEarnings = incentiveEarningsResult[0]?.total ?? 0;
    const totalEarned = classEarnings + incentiveEarnings;
    const totalClasses = totalClassesResult;
    const uniqueStudents = uniqueStudentsResult.length;
    const avgPerClass = totalClasses > 0 ? Math.round(classEarnings / totalClasses) : 0;

    // Format breakdowns
    const classBreakdown: Record<string, number> = {};
    classBreakdownResult.forEach((item: any) => {
      classBreakdown[item._id] = item.count;
    });

    const earningsBreakdown: Record<string, { total: number; count: number }> = {};
    const legacyPtmBreakdown = await legacyPtmClasses.reduce(
      async (totalsPromise, classRecord: any) => {
        const totals = await totalsPromise;
        const payment = await calculateClassPayment('ptm', classRecord.status, classRecord.date);
        return {
          regular: totals.regular + payment.regularAmount,
          ptm: totals.ptm + payment.ptmAmount,
          combined: totals.combined + payment.amount,
        };
      },
      Promise.resolve({ regular: 0, ptm: 0, combined: 0 })
    );
    earningsByTypeResult.forEach((item: any) => {
      if (item._id === 'ptm') {
        earningsBreakdown.regular = {
          total: (earningsBreakdown.regular?.total ?? 0) + item.regularTotal + legacyPtmBreakdown.regular,
          count: earningsBreakdown.regular?.count ?? 0,
        };
        earningsBreakdown.ptm = {
          total: item.ptmTotal - legacyPtmBreakdown.combined + legacyPtmBreakdown.ptm,
          count: item.count,
        };
      } else {
        earningsBreakdown[item._id] = { total: item.total, count: item.count };
      }
    });
    earningsBreakdown['no_show'] = { total: noShowEarningsResult[0]?.total ?? 0, count: 0 };
    earningsBreakdown['incentives'] = { total: incentiveEarnings, count: 0 };

    const statusBreakdown: Record<string, number> = {
      completed: 0, student_no_show: 0, cancelled: 0, rescheduled: 0
    };
    statusBreakdownResult.forEach((item: any) => {
      statusBreakdown[item._id] = item.count;
    });

    const schedulingBreakdown: Record<string, number> = { scheduled: 0, on_spot: 0 };
    schedulingBreakdownResult.forEach((item: any) => {
      schedulingBreakdown[item._id] = item.count;
    });

    // Week stats
    const thisWeek = thisWeekStatsResult[0] ?? { classes: 0, earnings: 0, students: [] };
    const lastWeek = lastWeekStatsResult[0] ?? { classes: 0, earnings: 0, students: [] };

    // Flatten earningsBreakdown values to plain numbers
    const flatEarningsBreakdown: Record<string, number> = {};
    Object.entries(earningsBreakdown).forEach(([key, value]) => {
      flatEarningsBreakdown[key] = (value as any).total ?? value;
    });

    const weekStats = {
      classes: thisWeek.classes,
      earnings: thisWeek.earnings,
      students: (thisWeek.students ?? []).filter((id: any) => id).length,
      prevClasses: lastWeek.classes,
      prevEarnings: lastWeek.earnings,
      prevStudents: (lastWeek.students ?? []).filter((id: any) => id).length,
    };

    // Top students: merge by earnings into the frontend contract shape
    const topStudents: Array<{ _id: string; name: string; count: number; earnings: number }> =
      (topStudentsByEarningsResult.length > 0 ? topStudentsByEarningsResult : topStudentsByCountResult)
        .map((item: any) => ({
          _id: String(item._id),
          name: item.studentName ?? 'Student',
          count: item.classCount ?? item.count ?? 0,
          earnings: item.earnings ?? 0,
        }));

    res.json({
      totalEarned,
      classEarnings,
      incentiveEarnings,
      totalClasses,
      uniqueStudents,
      avgPerClass,
      classBreakdown,
      earningsBreakdown: flatEarningsBreakdown,
      statusBreakdown,
      schedulingBreakdown,
      recentClasses,
      todayClasses: todayClassesResult,
      todayEarnings: todayEarningsResult[0]?.total ?? 0,
      paymentInfo: paymentStatus ?? null,
      weekStats,
      topStudents,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /monthly-history - Last 12 months of earnings
router.get('/monthly-history', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const months: string[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      months.push(`${y}-${String(m).padStart(2, '0')}`);
    }

    const [classEarnings, incentiveEarnings] = await Promise.all([
      Class.aggregate([
        { $match: { classMonth: { $in: months }, deletedAt: null } },
        { $group: { _id: '$classMonth', classTotal: { $sum: '$paymentAmount' }, classCount: { $sum: 1 } } }
      ]),
      Incentive.aggregate([
        { $match: { month: { $in: months } } },
        { $group: { _id: '$month', incentiveTotal: { $sum: '$amount' } } }
      ])
    ]);

    const classMap: Record<string, { total: number; count: number }> = {};
    classEarnings.forEach((item: any) => {
      classMap[item._id] = { total: item.classTotal, count: item.classCount };
    });

    const incentiveMap: Record<string, number> = {};
    incentiveEarnings.forEach((item: any) => {
      incentiveMap[item._id] = item.incentiveTotal;
    });

    const history = months.map(m => ({
      month: m,
      classEarnings: classMap[m]?.total ?? 0,
      incentiveEarnings: incentiveMap[m] ?? 0,
      totalEarnings: (classMap[m]?.total ?? 0) + (incentiveMap[m] ?? 0),
      classCount: classMap[m]?.count ?? 0,
    }));

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly history' });
  }
});

// GET /insights/:month - Auto-generated insight strings
router.get('/insights/:month', async (req: Request, res: Response) => {
  try {
    const month = String(req.params.month);
    const [year, monthNum] = month.split('-').map(Number);

    // Previous month
    let prevYear = year;
    let prevMonth = monthNum - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const baseFilter = { deletedAt: null };

    const [
      currentStats,
      prevStats,
      currentIncentives,
      prevIncentives,
      currentStatusBreakdown,
      currentTypeBreakdown,
      currentStudentCount,
      prevStudentCount,
    ] = await Promise.all([
      Class.aggregate([
        { $match: { ...baseFilter, classMonth: month } },
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            totalEarnings: { $sum: '$paymentAmount' },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            noShowCount: { $sum: { $cond: [{ $eq: ['$status', 'student_no_show'] }, 1, 0] } },
          }
        }
      ]),
      Class.aggregate([
        { $match: { ...baseFilter, classMonth: prevMonthStr } },
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            totalEarnings: { $sum: '$paymentAmount' },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            noShowCount: { $sum: { $cond: [{ $eq: ['$status', 'student_no_show'] }, 1, 0] } },
          }
        }
      ]),
      Incentive.aggregate([
        { $match: { month } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Incentive.aggregate([
        { $match: { month: prevMonthStr } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Class.aggregate([
        { $match: { ...baseFilter, classMonth: month } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Class.aggregate([
        { $match: { ...baseFilter, classMonth: month } },
        { $group: { _id: '$classType', count: { $sum: 1 }, earnings: { $sum: '$paymentAmount' } } },
        { $sort: { earnings: -1 } }
      ]),
      Class.distinct('studentId', { ...baseFilter, classMonth: month, studentId: { $ne: null } }),
      Class.distinct('studentId', { ...baseFilter, classMonth: prevMonthStr, studentId: { $ne: null } }),
    ]);

    const curr = currentStats[0] ?? { totalClasses: 0, totalEarnings: 0, completedCount: 0, noShowCount: 0 };
    const prev = prevStats[0] ?? { totalClasses: 0, totalEarnings: 0, completedCount: 0, noShowCount: 0 };
    const currIncentiveTotal = currentIncentives[0]?.total ?? 0;
    const prevIncentiveTotal = prevIncentives[0]?.total ?? 0;

    const currTotal = curr.totalEarnings + currIncentiveTotal;
    const prevTotal = prev.totalEarnings + prevIncentiveTotal;

    const insights: string[] = [];

    // Earning comparison
    if (prevTotal > 0) {
      const change = ((currTotal - prevTotal) / prevTotal * 100).toFixed(1);
      if (currTotal > prevTotal) {
        insights.push(`Total earnings are up ${change}% compared to last month (${currTotal.toLocaleString('en-IN')} vs ${prevTotal.toLocaleString('en-IN')}).`);
      } else if (currTotal < prevTotal) {
        insights.push(`Total earnings are down ${Math.abs(parseFloat(change))}% compared to last month (${currTotal.toLocaleString('en-IN')} vs ${prevTotal.toLocaleString('en-IN')}).`);
      } else {
        insights.push(`Total earnings are the same as last month at ${currTotal.toLocaleString('en-IN')}.`);
      }
    } else if (currTotal > 0) {
      insights.push(`Total earnings this month: ${currTotal.toLocaleString('en-IN')}. No data available for the previous month.`);
    }

    // Class count comparison
    if (prev.totalClasses > 0) {
      const classDiff = curr.totalClasses - prev.totalClasses;
      if (classDiff > 0) {
        insights.push(`You conducted ${classDiff} more classes than last month (${curr.totalClasses} vs ${prev.totalClasses}).`);
      } else if (classDiff < 0) {
        insights.push(`You conducted ${Math.abs(classDiff)} fewer classes than last month (${curr.totalClasses} vs ${prev.totalClasses}).`);
      }
    }

    // No-show rate
    if (curr.totalClasses > 0) {
      const noShowRate = ((curr.noShowCount / curr.totalClasses) * 100).toFixed(1);
      if (curr.noShowCount > 0) {
        insights.push(`Student no-show rate is ${noShowRate}% (${curr.noShowCount} out of ${curr.totalClasses} classes).`);
      } else {
        insights.push(`Great job! No student no-shows this month across ${curr.totalClasses} classes.`);
      }
    }

    // Student engagement
    const currStudents = currentStudentCount.length;
    const prevStudents = prevStudentCount.length;
    if (currStudents > prevStudents) {
      insights.push(`You're working with ${currStudents - prevStudents} more unique students this month (${currStudents} total).`);
    } else if (currStudents < prevStudents && prevStudents > 0) {
      insights.push(`Student engagement is down - ${prevStudents - currStudents} fewer unique students compared to last month.`);
    }

    // Top earning class type
    if (currentTypeBreakdown.length > 0) {
      const topType = currentTypeBreakdown[0];
      insights.push(`${topType._id.charAt(0).toUpperCase() + topType._id.slice(1)} classes are your top earner with ${topType.earnings.toLocaleString('en-IN')} from ${topType.count} classes.`);
    }

    // Ensure at least 3 insights
    if (insights.length < 3 && curr.totalClasses > 0) {
      const avgEarning = Math.round(curr.totalEarnings / curr.totalClasses);
      insights.push(`Average earning per class this month is ${avgEarning.toLocaleString('en-IN')}.`);
    }

    res.json({ month, insights: insights.slice(0, 5) });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
