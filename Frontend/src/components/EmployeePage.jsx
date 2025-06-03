"use client"

import { useEffect, useState } from "react"
import { Calendar, ChevronDown, Clock, Users, Loader2, AlertCircle } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import { fetchUserAttendance } from "../features/employee/employeeAttandanceSlice"
import { useParams } from "react-router-dom"
import { parseISO, format } from 'date-fns'
import { PulseLoader } from "react-spinners"
import { logoutUser } from "../features/auth/authSlice"
export default function EmployeePage() {
  const [selectedPeriod, setSelectedPeriod] = useState("thisWeek")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dispatch = useDispatch()
  const { loading, error, days } = useSelector((state) => state.employeeAttendance)
  const {user} = useSelector((state)=>state.auth)
  useEffect(() => {
    handlePeriodChange('thisWeek')
  }, [dispatch])



const formatDate = (dateString) => {
    console.log(dateString)
  const date = parseISO(dateString) // treats dateString as local date
  return format(date, "EEE, MMM d") // Fri, Jun 2
}


  const getStatusColor = (status) => {
    return status === "Present"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : status === "Corrupted"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200"
  }

 const handlePeriodChange = (period, startDate = null, endDate = null) => {
  setSelectedPeriod(period)

  if (period === "custom") {
    setShowDatePicker(true)
    if (startDate && endDate) {
      dispatch(fetchUserAttendance({start_date: startDate, end_date: endDate }))
    }
  } else {
    setShowDatePicker(false)

    let start, end
    const today = new Date()

    if (period === "thisWeek") {
      const dayOfWeek = today.getDay() || 7 // Sunday = 0 → treat as 7
      start = new Date(today)
      start.setDate(today.getDate() - dayOfWeek + 1) // Monday this week
      end = new Date(today) // today
    } 
    else if (period === "lastWeek") {
      const dayOfWeek = today.getDay() || 7
      start = new Date(today)
      start.setDate(today.getDate() - dayOfWeek - 6) // Monday last week
      end = new Date(today)
      end.setDate(today.getDate() - dayOfWeek) // Sunday last week
    } 
    else if (period === "thisMonth") {
      start = new Date(today.getFullYear(), today.getMonth(), 1) // 1st of current month
      end = new Date(today) // today
    } 
    else if (period === "lastMonth") {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1) // 1st of last month
      end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0) // last day of last month
    } 
    else {
      start = null
      end = null
    }

    if (start && end) {
      const formattedStart = start.toISOString().split("T")[0]
      const formattedEnd = end.toISOString().split("T")[0]
      dispatch(fetchUserAttendance({ start_date: formattedStart, end_date: formattedEnd }))
    }
  }
}



  // Count summary numbers dynamically
  const totalDays = days?.length || 0
  const presentDays = days?.filter((d) => d.status === "Present").length || 0
  const absentDays = days?.filter((d) => d.status === "Absent").length || 0
  const corruptedDays = days?.filter((d) => d.status === "Corrupted").length || 0

  // Compute average hours for present days only
  const avgHours =
    days && days.length
      ? (
          days
            .filter((d) => d.status === "Present")
            .reduce((sum, d) => {
              const [h, m] = d.totalInTime.split("h").map((s) => s.replace("m", "").trim())
              return sum + parseInt(h || 0) * 60 + parseInt(m || 0)
            }, 0) / (presentDays || 1)
        ).toFixed(0)
      : 0
  
const averageInTime = Number.isNaN(avgHours)
  ? "-h -m"
  : `${Math.floor(avgHours / 60)}h ${Math.floor(avgHours % 60)}m`

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
          <button
            onClick={()=>{dispatch(logoutUser())}}
            className="bg-red-500 ml-auto hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-2xl shadow-md transition duration-200"
            >
            Logout
         </button>

          </div>
          <p className="text-gray-600 text-start ml-14">  {user?.empid}</p>
        </div>
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-gray-700">Period:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePeriodChange("thisWeek")}
                disabled={loading}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedPeriod === "thisWeek"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                This Week
              </button>
              <button
                onClick={() => handlePeriodChange("lastWeek")}
                disabled={loading}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedPeriod === "lastWeek"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Last Week
              </button>
              <button
                onClick={() => handlePeriodChange("thisMonth")}
                disabled={loading}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedPeriod === "thisMonth"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                This Month
              </button>
              <button
                onClick={() => handlePeriodChange("lastMonth")}
                disabled={loading}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedPeriod === "lastMonth"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Last Month
              </button>
              <button
                onClick={() => handlePeriodChange("custom")}
                disabled={loading}
                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                  selectedPeriod === "custom"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Custom Range
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {showDatePicker && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => dispatch(fetchUserAttendance({ start_date: customStartDate, end_date: customEndDate }))}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    disabled={loading || !customStartDate || !customEndDate}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
            <span className="ml-2 text-emerald-700 font-medium">Loading attendance...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error: {error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Days</p>
                    <p className="text-2xl font-bold text-gray-900">{totalDays}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Days</p>
                    <p className="text-2xl font-bold text-emerald-600">{presentDays}</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent Days</p>
                    <p className="text-2xl font-bold text-red-600">{absentDays}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. In Time</p>
                    <p className="text-2xl font-bold text-gray-900">{averageInTime}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Daily Attendance Records</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        First Entry
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Last Exit
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Total IN Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Total OUT Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {days?.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{formatDate(record.date)}</div>
                          <div className="text-sm text-gray-500">{record.date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-medium ${
                              record.firstEntry === "-" ? "text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {record.firstEntry}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-medium ${
                              record.lastExit === "-" ? "text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {record.lastExit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-medium ${
                              record.totalInTime === "-" ? "text-gray-400" : "text-emerald-600"
                            }`}
                          >
                            {record.totalInTime}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-medium ${
                              record.totalOutTime === "-" ? "text-gray-400" : "text-orange-600"
                            }`}
                          >
                            {record.totalOutTime}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
