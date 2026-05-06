import { X, Edit, UserCheck, UserX, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign } from 'lucide-react';
import { Employee } from './EmployeesModule';
import { getCountryName } from '../data/countries';

interface EmployeeDetailProps {
  employee: Employee;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  onToggleActive: (id: string) => void;
  busy?: boolean;
}

export function EmployeeDetail({ employee, onClose, onEdit, onToggleActive, busy = false }: EmployeeDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-2xl text-blue-600 dark:text-blue-400">
                {employee.firstName.charAt(0)}
                {employee.surname.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl text-gray-900 dark:text-white">
                {employee.firstName} {employee.surname}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{employee.position}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(employee)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  {employee.isActive ? (
                    <UserCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <UserX className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="mt-2">
                  {employee.isActive ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400">
                      Passive
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Department</span>
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <p className="mt-2 text-gray-900 dark:text-white">{employee.department}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sales Person</span>
                  {employee.isSalesPerson ? (
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  ) : (
                    <UserX className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="mt-2 text-gray-900 dark:text-white">
                  {employee.isSalesPerson ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Employee Code</label>
                  <p className="text-gray-900 dark:text-white">{employee.employeeCode}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                  <p className="text-gray-900 dark:text-white">
                    {employee.firstName} {employee.surname}
                  </p>
                </div>
                {employee.dateOfBirth && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Date of Birth</label>
                    <p className="text-gray-900 dark:text-white">{employee.dateOfBirth}</p>
                  </div>
                )}
                {employee.personalId && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Personal ID</label>
                    <p className="text-gray-900 dark:text-white">{employee.personalId}</p>
                  </div>
                )}
                {employee.gender && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Gender</label>
                    <p className="text-gray-900 dark:text-white">{employee.gender}</p>
                  </div>
                )}
                {(employee.address || employee.city || employee.country) && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {employee.address && <span>{employee.address}<br /></span>}
                      {employee.city && <span>{employee.city}, </span>}
                      {employee.country && getCountryName(employee.country)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Company Information */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Position</label>
                  <p className="text-gray-900 dark:text-white">{employee.position}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Department</label>
                  <p className="text-gray-900 dark:text-white">{employee.department}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date of Hire
                  </label>
                  <p className="text-gray-900 dark:text-white">{employee.dateOfHire}</p>
                </div>
                {employee.dateOfTermination && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Date of Termination</label>
                    <p className="text-gray-900 dark:text-white">{employee.dateOfTermination}</p>
                  </div>
                )}
                {employee.employmentType && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Employment Type</label>
                    <p className="text-gray-900 dark:text-white">{employee.employmentType}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Roles */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Roles & Access
              </h3>
              <div className="flex flex-wrap gap-2">
                {employee.isSalesPerson && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm">
                    Sales Person
                  </span>
                )}
                {employee.isManager && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-sm">
                    Manager
                  </span>
                )}
                {employee.hasSystemAccess && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
                    System Access
                  </span>
                )}
                {!employee.isSalesPerson && !employee.isManager && !employee.hasSystemAccess && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">No special roles assigned</span>
                )}
              </div>
            </section>

            {/* Contact Details */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {employee.email && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Work Email
                    </label>
                    <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                      {employee.email}
                    </a>
                  </div>
                )}
                {employee.personalEmail && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Personal Email</label>
                    <a href={`mailto:${employee.personalEmail}`} className="text-blue-600 hover:underline">
                      {employee.personalEmail}
                    </a>
                  </div>
                )}
                {employee.phone && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Work Phone
                    </label>
                    <p className="text-gray-900 dark:text-white">{employee.phone}</p>
                  </div>
                )}
                {employee.mobilePhone && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Mobile Phone</label>
                    <p className="text-gray-900 dark:text-white">{employee.mobilePhone}</p>
                  </div>
                )}
                {employee.emergencyContactName && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Emergency Contact</label>
                    <p className="text-gray-900 dark:text-white">{employee.emergencyContactName}</p>
                    {employee.emergencyContactPhone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{employee.emergencyContactPhone}</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Payroll Information */}
            {(employee.salaryType || employee.basicSalary || employee.iban || employee.taxCode) && (
              <section>
                <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <DollarSign className="w-5 h-5 inline mr-2" />
                  Payroll Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {employee.salaryType && (
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Salary Type</label>
                      <p className="text-gray-900 dark:text-white">{employee.salaryType}</p>
                    </div>
                  )}
                  {employee.basicSalary && (
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Basic Salary</label>
                      <p className="text-gray-900 dark:text-white">
                        {employee.currency} {employee.basicSalary.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {employee.iban && (
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">IBAN</label>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">{employee.iban}</p>
                    </div>
                  )}
                  {employee.taxCode && (
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tax Code</label>
                      <p className="text-gray-900 dark:text-white">{employee.taxCode}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Notes */}
            {employee.notes && (
              <section>
                <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Notes
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{employee.notes}</p>
              </section>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={() => onToggleActive(employee.id)}
            disabled={busy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              employee.isActive
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {employee.isActive ? (
              <>
                <UserX className="w-4 h-4" />
                Set as Passive
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Set as Active
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
