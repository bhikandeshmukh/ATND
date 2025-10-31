"use client";

import { useState, useEffect } from 'react';

interface RealTimeEarningProps {
  employeeName: string;
  checkInTime: string;
  checkInDate: string;
  perMinuteRate?: number;
  fixedSalary?: number;
  totalWorkingDays?: number;
}

export default function RealTimeEarning({
  employeeName,
  checkInTime,
  checkInDate,
  perMinuteRate,
  fixedSalary,
  totalWorkingDays,
}: RealTimeEarningProps) {
  const [currentEarning, setCurrentEarning] = useState(0);
  const [minutesWorked, setMinutesWorked] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      calculateCurrentEarning();
    }, 1000);

    return () => clearInterval(interval);
  }, [checkInTime, perMinuteRate, fixedSalary, totalWorkingDays]);

  const calculateCurrentEarning = () => {
    try {
      // Parse check-in time
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes, seconds] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const checkInMinutes = parseTime(checkInTime);

      // Get current time
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      // Calculate minutes worked
      let worked = currentTotalMinutes - checkInMinutes;
      if (worked < 0) worked += 24 * 60; // Handle overnight

      setMinutesWorked(worked);

      // Format current time
      const period = currentHours >= 12 ? 'PM' : 'AM';
      const displayHours = currentHours % 12 || 12;
      const timeStr = `${displayHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')} ${period}`;
      setCurrentTime(timeStr);

      // Calculate earning
      let earning = 0;
      if (perMinuteRate && perMinuteRate > 0) {
        // Per minute rate calculation
        earning = worked * perMinuteRate;
      } else if (fixedSalary && fixedSalary > 0 && totalWorkingDays) {
        // Fixed salary - calculate proportional earning
        const dailySalary = fixedSalary / totalWorkingDays;
        const minutesInWorkDay = 10 * 60; // Assuming 10 hour work day
        const perMinute = dailySalary / minutesInWorkDay;
        earning = worked * perMinute;
      }

      setCurrentEarning(Math.round(earning));
    } catch (error) {
      console.error('Error calculating earning:', error);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-4 mb-4 border-2 border-green-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-3xl animate-pulse">💰</div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Real-Time Earning</h3>
            <p className="text-xs text-gray-600">Live counter - Updates every second</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Current Time</div>
          <div className="text-sm font-semibold text-gray-700">{currentTime}</div>
        </div>
      </div>

      {/* Main Earning Display */}
      <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Current Earning</div>
          <div className="text-4xl font-bold text-green-600 mb-2">
            ₹{currentEarning.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(minutesWorked)} worked
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">Check-In Time</div>
          <div className="text-sm font-semibold text-gray-900">{checkInTime}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">Minutes Worked</div>
          <div className="text-sm font-semibold text-gray-900">{minutesWorked} min</div>
        </div>
      </div>

      {/* Rate Info */}
      <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-800">
          {perMinuteRate && perMinuteRate > 0 ? (
            <>💵 Rate: ₹{perMinuteRate}/minute</>
          ) : (
            <>💵 Fixed Salary: ₹{fixedSalary?.toLocaleString('en-IN')}/month</>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        ⏱️ Counter will stop when you check out
      </div>
    </div>
  );
}
