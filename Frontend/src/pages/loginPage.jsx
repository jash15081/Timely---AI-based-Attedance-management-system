"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Eye, EyeOff, Lock, User, UserCircle, X } from "lucide-react"
import { loginAdmin, loginEmployee, resetEmployeePassword, resetAdminPassword, clearAuthError, clearResetPasswordState } from "../features/auth/authSlice"
import { PulseLoader } from "react-spinners"

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState("employee")
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [loginForm, setLoginForm] = useState({
    username: "",
    employeeId: "",
    password: "",
  })
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    identifier: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  const {
    error,
    resetPasswordError,
    resetPasswordSuccess,
    resetPasswordLoading,
    loading
  } = useSelector((state) => state.auth)
  
  const [errors, setErrors] = useState({})
  const dispatch = useDispatch()

  const handleLoginFormChange = (e) => {
    const { name, value } = e.target
    setLoginForm({
      ...loginForm,
      [name]: value,
    })
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
    if (errors.auth) {
      dispatch(clearAuthError())
    }
  }
  
 
    useEffect(() => {
    if (error) {
        setErrors({ auth: error });
    }
    }, [error]);

    useEffect(() => {
    if (resetPasswordError) {
        setErrors({ resetPass: resetPasswordError });
    }
    }, [resetPasswordError]);

  const handleForgotPasswordFormChange = (e) => {
    const { name, value } = e.target
    setForgotPasswordForm({
      ...forgotPasswordForm,
      [name]: value,
    })
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
    if (errors.resetPass) {
      dispatch(clearResetPasswordState())
    }
  }

  const validateLoginForm = () => {
    const newErrors = {}

    if (activeRole === "admin") {
      if (!loginForm.username.trim()) {
        newErrors.username = "Username is required"
      }
    } else {
      if (!loginForm.employeeId.trim()) {
        newErrors.employeeId = "Employee ID is required"
      }
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required"
    } else if (loginForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForgotPasswordForm = () => {
    const newErrors = {}

    if (!forgotPasswordForm.identifier.trim()) {
      newErrors.identifier = activeRole === "admin" ? "Username is required" : "Employee ID is required"
    }

    if (!forgotPasswordForm.oldPassword) {
      newErrors.oldPassword = "Current password is required"
    }

    if (!forgotPasswordForm.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (forgotPasswordForm.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters"
    }

    if (!forgotPasswordForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (forgotPasswordForm.newPassword !== forgotPasswordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()

    if (validateLoginForm()) {
      if (activeRole === "admin") {
        dispatch(
          loginAdmin({
            username: loginForm.username,
            password: loginForm.password,
          }),
        )
      } else {
        dispatch(
          loginEmployee({
            empid: loginForm.employeeId,
            password: loginForm.password,
          }),
        )
      }
    }
  }

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault()

    if (validateForgotPasswordForm()) {
      if (activeRole === "admin") {
        dispatch(resetAdminPassword({
          username: forgotPasswordForm.identifier,
          oldPassword: forgotPasswordForm.oldPassword,
          newPassword: forgotPasswordForm.newPassword
        }))
      } else {
        dispatch(resetEmployeePassword({
          empid: forgotPasswordForm.identifier,
          oldPassword: forgotPasswordForm.oldPassword,
          newPassword: forgotPasswordForm.newPassword
        }))
      }
    }
  }

  const toggleRole = (role) => {
    setActiveRole(role)
    setErrors({})
    dispatch(clearAuthError())
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false)
    setErrors({})
    dispatch(clearResetPasswordState())
    // Reset form after a delay to allow modal to close smoothly
    setTimeout(() => {
      setForgotPasswordForm({
        identifier: "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header with Role Toggle */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => toggleRole("employee")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeRole === "employee"
                  ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Employee Login
            </button>
            <button
              onClick={() => toggleRole("admin")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeRole === "admin"
                  ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Admin Login
            </button>
          </div>

          {/* Login Form */}
          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <UserCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeRole === "admin" ? "Admin Login" : "Employee Login"}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeRole === "admin" ? "Access the admin dashboard" : "Track your attendance and more"}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit}>
              {/* Username/Employee ID Field */}
              <div className="mb-4">
                <label
                  htmlFor={activeRole === "admin" ? "username" : "employeeId"}
                  className="block text-start text-sm font-medium text-gray-700 mb-1"
                >
                  {activeRole === "admin" ? "Username" : "Employee ID or Email"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id={activeRole === "admin" ? "username" : "employeeId"}
                    name={activeRole === "admin" ? "username" : "employeeId"}
                    value={activeRole === "admin" ? loginForm.username : loginForm.employeeId}
                    onChange={handleLoginFormChange}
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.username || errors.employeeId
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                    } rounded-lg focus:outline-none focus:ring-2`}
                    placeholder={activeRole === "admin" ? "Enter username" : "Enter employee ID or Email"}
                  />
                </div>
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>}
              </div>

              {/* Password Field */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setErrors({}); setShowForgotPasswordModal(true) }}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Change Password
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginFormChange}
                    className={`w-full pl-10 pr-10 py-2 border ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                    } rounded-lg focus:outline-none focus:ring-2`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Submit Button */}
              {errors.auth && <p className="mt-1 mb-2 text-md text-red-600">{errors.auth}</p>}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  loading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          © {new Date().getFullYear()} Script All DNA. All rights reserved.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Reset Password</h2>
              <button
                onClick={closeForgotPasswordModal}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="p-6">
              {resetPasswordSuccess && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                  Password reset successfully! You can now login with your new password.
                </div>
              )}

              {/* Identifier Field (Username/Employee ID) */}
              <div className="mb-4">
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                  {activeRole === "admin" ? "Username" : "Employee ID"}
                </label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={forgotPasswordForm.identifier}
                  onChange={handleForgotPasswordFormChange}
                  className={`w-full px-4 py-2 border ${
                    errors.identifier
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  } rounded-lg focus:outline-none focus:ring-2`}
                  placeholder={`Enter your ${activeRole === "admin" ? "username" : "employee ID"}`}
                />
                {errors.identifier && <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>}
              </div>

              {/* Old Password Field */}
              <div className="mb-4">
                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="oldPassword"
                  name="oldPassword"
                  value={forgotPasswordForm.oldPassword}
                  onChange={handleForgotPasswordFormChange}
                  className={`w-full px-4 py-2 border ${
                    errors.oldPassword
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  } rounded-lg focus:outline-none focus:ring-2`}
                  placeholder="Enter your current password"
                />
                {errors.oldPassword && <p className="mt-1 text-sm text-red-600">{errors.oldPassword}</p>}
              </div>

              {/* New Password Field */}
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={forgotPasswordForm.newPassword}
                  onChange={handleForgotPasswordFormChange}
                  className={`w-full px-4 py-2 border ${
                    errors.newPassword
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  } rounded-lg focus:outline-none focus:ring-2`}
                  placeholder="Enter new password"
                />
                {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
              </div>

              {/* Confirm New Password Field */}
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={forgotPasswordForm.confirmPassword}
                  onChange={handleForgotPasswordFormChange}
                  className={`w-full px-4 py-2 border ${
                    errors.confirmPassword
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  } rounded-lg focus:outline-none focus:ring-2`}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
              
              {errors.resetPass && <p className="mb-2 text-md text-red-600">{errors.resetPass}</p>}
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={resetPasswordLoading}
                className={`w-full h-12 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  resetPasswordLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {resetPasswordLoading ? (
                  <div className="flex items-center justify-center">
                    <PulseLoader color="#FFFFFF" size={8}/>
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}