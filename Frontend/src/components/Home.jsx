"use client"

import { useEffect, useState } from "react"
import { Calendar, Users, UserCheck, UserX, Clock } from "lucide-react"
import { parseISO, format } from "date-fns"
import { useDispatch, useSelector } from "react-redux"
import { fetchAttendanceSummary } from "../features/employee/dailySummery"
import { useNavigate } from "react-router-dom"
export default function Home() {
  const dispatch = useDispatch()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const navigate = useNavigate()
  const {
    loading,
    error,
    date,
    totalEmployees = 0,
    totalPresent = 0,
    totalAbsent = 0,
    presentEmployees = [],
    absentEmployees = [],
  } = useSelector((state) => state.dailySummery)

  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchAttendanceSummary(selectedDate))
    }
  }, [dispatch, selectedDate])

  const formatDate = (dateString) => {
    const date = parseISO(dateString)
    return format(date, "EEE, MMM d")
  }

  const isToday = selectedDate === new Date().toISOString().split("T")[0]
  const attendanceRate =
    totalEmployees > 0 ? ((totalPresent / totalEmployees) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Attendance Overview</h1>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{formatDate(selectedDate)}</h2>
              <p className="text-gray-600">{isToday ? "Current day attendance" : "Historical attendance data"}</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard title="Total Employees" value={totalEmployees} icon={<Users className="w-6 h-6 text-blue-600" />} bgColor="bg-blue-100" />
          <SummaryCard title="Present Today" value={totalPresent} icon={<UserCheck className="w-6 h-6 text-emerald-600" />} bgColor="bg-emerald-100" />
          <SummaryCard title="Absent Today" value={totalAbsent} icon={<UserX className="w-6 h-6 text-red-600" />} bgColor="bg-red-100" />
          <SummaryCard title="Attendance Rate" value={`${attendanceRate}%`} icon={<Clock className="w-6 h-6 text-emerald-600" />} bgColor="bg-emerald-100" />
        </div>

        {/* Employee Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeList
            title="Present Employees"
            count={totalPresent}
            employees={presentEmployees}
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            bgHeader="bg-emerald-50"
            borderHeader="border-emerald-100"
            bgCard="bg-emerald-50"
            borderCard="border-emerald-100"
            type="present"
          />

          <EmployeeList
            title="Absent Employees"
            count={totalAbsent}
            employees={absentEmployees}
            icon={<UserX className="w-5 h-5 text-red-600" />}
            bgHeader="bg-red-50"
            borderHeader="border-red-100"
            bgCard="bg-red-50"
            borderCard="border-red-100"
            type="absent"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div>
      </div>
    </div>
  )
}

// Summary Card Component
const SummaryCard = ({ title, value, icon, bgColor }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 ${bgColor} rounded-lg`}>{icon}</div>
    </div>
  </div>
)

// Employee List Component
const EmployeeList = ({ title, count, employees, icon, bgHeader, borderHeader, bgCard, borderCard, type }) =>{
  const navigate = useNavigate()
  return (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className={`px-6 py-4 ${bgHeader} border-b ${borderHeader}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className={`text-lg font-semibold ${type === "present" ? "text-emerald-800" : "text-red-800"}`}>
          {title} ({count})
        </h3>
      </div>
    </div>

    <div className="p-6">
      {employees.length > 0 ? (
        <div className="space-y-4">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className={`flex items-center justify-between p-4 ${bgCard} rounded-lg border ${borderCard}`}
            >
              <div>
                <h4 className="font-medium text-gray-900">{employee.name}</h4>
                <p className="text-sm text-gray-600">{employee.department}</p>
              </div>
              <div className="text-right">
                {type === "present" ? (
                  <button
                    onClick={() => navigate(`employees/employee-details/${employee.empid}`)}
                    className="px-4 py-1 text-sm font-medium text-emerald-600 border border-emerald-600 bg-white rounded-lg hover:bg-emerald-600 hover:text-white transition"
                  >
                    See
                </button>
                ) : (
                 <button
                    onClick={() => navigate(`employees/employee-details/${employee.empid}`)}
                    className="px-4 py-1 text-sm font-medium text-emerald-600 border border-emerald-600 bg-white rounded-lg hover:bg-emerald-600 hover:text-white transition"
                  >
                    See
                </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {type === "present"
              ? "No employees present on this date"
              : "All employees present on this date"}
          </p>
        </div>
      )}
    </div>
  </div>
)
}