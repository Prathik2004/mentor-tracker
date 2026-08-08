import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Class from '../models/Class';
import Incentive from '../models/Incentive';
import Payment from '../models/Payment';
import Student from '../models/Student';

const router = Router();

// GET /monthly/:month - Full monthly report data
router.get('/monthly/:month', async (req: Request, res: Response) => {
  try {
    const { month } = req.params;
    const baseFilter = { classMonth: month, deletedAt: null };

    const [classes, incentives, payment, summary, studentBreakdown, dailyBreakdown] = await Promise.all([
      Class.find(baseFilter)
        .populate('studentId', 'name course')
        .sort({ date: 1 })
        .lean(),

      Incentive.find({ month }).sort({ date: 1 }).lean(),

      Payment.findOne({ earningMonth: month }).lean(),

      Class.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            totalEarnings: { $sum: '$paymentAmount' },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            noShowCount: { $sum: { $cond: [{ $eq: ['$status', 'student_no_show'] }, 1, 0] } },
            cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            rescheduledCount: { $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] } },
          }
        }
      ]),

      Class.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$studentId',
            classCount: { $sum: 1 },
            earnings: { $sum: '$paymentAmount' },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          }
        },
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
            studentName: '$student.name',
            course: '$student.course',
            classCount: 1,
            earnings: 1,
            completedCount: 1,
          }
        },
        { $sort: { earnings: -1 } }
      ]),

      Class.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            classCount: { $sum: 1 },
            earnings: { $sum: '$paymentAmount' },
          }
        },
        { $sort: { _id: 1 } }
      ]),
    ]);

    const summaryData = summary[0] ?? {
      totalClasses: 0, totalEarnings: 0, completedCount: 0,
      noShowCount: 0, cancelledCount: 0, rescheduledCount: 0
    };

    const incentiveTotal = incentives.reduce((sum, i) => sum + i.amount, 0);

    res.json({
      month,
      summary: {
        ...summaryData,
        incentiveEarnings: incentiveTotal,
        totalEarnings: summaryData.totalEarnings + incentiveTotal,
      },
      classes,
      incentives,
      payment,
      studentBreakdown,
      dailyBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// GET /student/:studentId - Student report data
router.get('/student/:studentId', async (req: Request, res: Response) => {
  try {
    const studentId = String(req.params.studentId);
    const { startDate, endDate } = req.query;

    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const filter: any = { studentId: new mongoose.Types.ObjectId(studentId), deletedAt: null };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const [classes, monthlySummary, overallStats] = await Promise.all([
      Class.find(filter).sort({ date: -1 }).lean(),

      Class.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$classMonth',
            classCount: { $sum: 1 },
            earnings: { $sum: '$paymentAmount' },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            noShowCount: { $sum: { $cond: [{ $eq: ['$status', 'student_no_show'] }, 1, 0] } },
          }
        },
        { $sort: { _id: -1 } }
      ]),

      Class.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            totalEarnings: { $sum: '$paymentAmount' },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            noShowCount: { $sum: { $cond: [{ $eq: ['$status', 'student_no_show'] }, 1, 0] } },
            cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            rescheduledCount: { $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] } },
            firstClass: { $min: '$date' },
            lastClass: { $max: '$date' },
          }
        }
      ]),
    ]);

    const stats = overallStats[0] ?? {
      totalClasses: 0, totalEarnings: 0, completedCount: 0,
      noShowCount: 0, cancelledCount: 0, rescheduledCount: 0,
      firstClass: null, lastClass: null
    };

    res.json({
      student,
      stats,
      monthlySummary,
      classes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate student report' });
  }
});

// GET /yearly/:year - Yearly report
router.get('/yearly/:year', async (req: Request, res: Response) => {
  try {
    const year = parseInt(String(req.params.year), 10);
    const months: string[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push(`${year}-${String(m).padStart(2, '0')}`);
    }

    const [monthlyClassData, monthlyIncentiveData, payments, yearlyStats] = await Promise.all([
      Class.aggregate([
        { $match: { classMonth: { $in: months }, deletedAt: null } },
        {
          $group: {
            _id: '$classMonth',
            totalClasses: { $sum: 1 },
            totalEarnings: { $sum: '$paymentAmount' },
            completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            noShowCount: { $sum: { $cond: [{ $eq: ['$status', 'student_no_show'] }, 1, 0] } },
            cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            students: { $addToSet: '$studentId' },
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Incentive.aggregate([
        { $match: { month: { $in: months } } },
        { $group: { _id: '$month', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),

      Payment.find({ earningMonth: { $in: months } }).sort({ earningMonth: 1 }).lean(),

      Class.aggregate([
        { $match: { classMonth: { $in: months }, deletedAt: null } },
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            totalEarnings: { $sum: '$paymentAmount' },
            students: { $addToSet: '$studentId' },
          }
        }
      ]),
    ]);

    const classMap: Record<string, any> = {};
    monthlyClassData.forEach((item: any) => {
      classMap[item._id] = item;
    });

    const incentiveMap: Record<string, any> = {};
    monthlyIncentiveData.forEach((item: any) => {
      incentiveMap[item._id] = item;
    });

    const monthlyBreakdown = months.map(m => {
      const cd = classMap[m] ?? { totalClasses: 0, totalEarnings: 0, completedCount: 0, noShowCount: 0, cancelledCount: 0, students: [] };
      const id = incentiveMap[m] ?? { total: 0, count: 0 };
      return {
        month: m,
        totalClasses: cd.totalClasses,
        classEarnings: cd.totalEarnings,
        incentiveEarnings: id.total,
        totalEarnings: cd.totalEarnings + id.total,
        completedCount: cd.completedCount,
        noShowCount: cd.noShowCount,
        cancelledCount: cd.cancelledCount,
        uniqueStudents: cd.students?.length ?? 0,
      };
    });

    const yearStats = yearlyStats[0] ?? { totalClasses: 0, totalEarnings: 0, students: [] };
    const totalIncentives = monthlyIncentiveData.reduce((sum: number, item: any) => sum + item.total, 0);

    res.json({
      year,
      summary: {
        totalClasses: yearStats.totalClasses,
        classEarnings: yearStats.totalEarnings,
        incentiveEarnings: totalIncentives,
        totalEarnings: yearStats.totalEarnings + totalIncentives,
        uniqueStudents: yearStats.students?.length ?? 0,
      },
      monthlyBreakdown,
      payments,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate yearly report' });
  }
});

// GET /export/:format - Export data as CSV or JSON
router.get('/export/:format', async (req: Request, res: Response) => {
  try {
    const { format } = req.params;
    const { month, type, startDate, endDate } = req.query;

    if (format !== 'csv' && format !== 'json') {
      return res.status(400).json({ error: 'Format must be csv or json' });
    }

    let data: any[] = [];
    let filename = 'export';
    let headers: string[] = [];

    if (type === 'incentives') {
      const filter: any = {};
      if (month) filter.month = month;

      data = await Incentive.find(filter).sort({ date: 1 }).lean();
      filename = `incentives${month ? `_${month}` : ''}`;
      headers = ['Date', 'Type', 'Description', 'Amount', 'Month', 'Notes'];

      if (format === 'csv') {
        const csvRows = [headers.join(',')];
        data.forEach(row => {
          csvRows.push([
            new Date(row.date).toISOString().split('T')[0],
            `"${row.type}"`,
            `"${row.description || ''}"`,
            row.amount,
            row.month,
            `"${row.notes || ''}"`,
          ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csvRows.join('\n'));
      }
    } else {
      // Default to classes export
      const filter: any = { deletedAt: null };
      if (month) filter.classMonth = month;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }

      data = await Class.find(filter)
        .populate('studentId', 'name course')
        .sort({ date: 1 })
        .lean();

      filename = `classes${month ? `_${month}` : ''}`;
      headers = ['Date', 'Student', 'Course', 'Class Type', 'Status', 'Scheduling', 'Payment Amount', 'Class Month', 'Payment Month', 'Notes'];

      if (format === 'csv') {
        const csvRows = [headers.join(',')];
        data.forEach((row: any) => {
          const studentName = typeof row.studentId === 'object' ? row.studentId.name : 'Unknown';
          const course = typeof row.studentId === 'object' ? (row.studentId.course || '') : '';
          csvRows.push([
            new Date(row.date).toISOString().split('T')[0],
            `"${studentName}"`,
            `"${course}"`,
            row.classType,
            row.status,
            row.schedulingType,
            row.paymentAmount,
            row.classMonth,
            row.paymentMonth,
            `"${row.notes || ''}"`,
          ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csvRows.join('\n'));
      }
    }

    // JSON export
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
