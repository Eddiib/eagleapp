import { useEffect, useState } from 'react';
import { Loader2, Save, UserPlus, X } from 'lucide-react';
import { Employee } from './EmployeesModule';
import { countries } from '../data/countries';
import { useCompanySettings } from '../context/CompanySettingsContext';

interface EmployeeFormProps {
  employee?: Employee;
  onSave: (employee: Employee, options?: { saveAndNew?: boolean }) => Promise<void> | void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

function createEmptyEmployeeFormData(defaultCurrency = 'EUR'): Partial<Employee> {
  return {
    firstName: '',
    surname: '',
    position: '',
    department: 'Operations',
    isActive: true,
    isSalesPerson: false,
    dateOfHire: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    employmentType: 'Full-time',
    isManager: false,
    hasSystemAccess: false,
    currency: defaultCurrency,
  };
}

export function EmployeeForm({ employee, onSave, onCancel, mode }: EmployeeFormProps) {
  const { baseCurrency } = useCompanySettings();
  const currencyOptions = Array.from(new Set([baseCurrency, 'EUR', 'USD', 'GBP', 'CHF'].filter(Boolean)));
  const [formData, setFormData] = useState<Partial<Employee>>(
    employee || createEmptyEmployeeFormData(baseCurrency)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(employee || createEmptyEmployeeFormData(baseCurrency));
    setErrors({});
    setSubmitError(null);
    setSaving(false);
  }, [employee, mode, baseCurrency]);

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitError) {
      setSubmitError(null);
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.surname?.trim()) {
      newErrors.surname = 'Surname is required';
    }
    if (!formData.position?.trim()) {
      newErrors.position = 'Position is required';
    }
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    if (!formData.dateOfHire) {
      newErrors.dateOfHire = 'Date of hire is required';
    }
    if (formData.hasSystemAccess && !formData.email?.trim()) {
      newErrors.email = 'Work email is required for system users';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, saveAndNew: boolean = false) => {
    e.preventDefault();

    if (saving || !validate()) {
      return;
    }

    // Generate employee code if creating new
    const employeeData: Employee = {
      id: employee?.id || Date.now().toString(),
      employeeCode: employee?.employeeCode || `EMP${String(Math.floor(Math.random() * 9000) + 1000).padStart(3, '0')}`,
      firstName: formData.firstName!,
      surname: formData.surname || '',
      position: formData.position!,
      department: formData.department!,
      isActive: formData.isActive ?? true,
      isSalesPerson: formData.isSalesPerson ?? false,
      dateOfHire: formData.dateOfHire!,
      email: formData.email!,
      phone: formData.phone || '',
      dateOfBirth: formData.dateOfBirth,
      personalId: formData.personalId,
      gender: formData.gender,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      dateOfTermination: formData.dateOfTermination,
      employmentType: formData.employmentType,
      isManager: formData.isManager,
      hasSystemAccess: formData.hasSystemAccess,
      personalEmail: formData.personalEmail,
      mobilePhone: formData.mobilePhone,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      salaryType: formData.salaryType,
      basicSalary: formData.basicSalary,
      currency: formData.currency,
      iban: formData.iban,
      taxCode: formData.taxCode,
      notes: formData.notes,
    };

    setSaving(true);
    setSubmitError(null);
    try {
      await onSave(employeeData, { saveAndNew });
      if (saveAndNew) {
        setFormData(createEmptyEmployeeFormData());
        setErrors({});
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-900 dark:text-white">
            {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
          </h2>
          <button
            onClick={onCancel}
            disabled={saving}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            {/* PERSONAL INFORMATION */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.surname || ''}
                    onChange={(e) => handleChange('surname', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.surname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Personal ID / National ID</label>
                  <input
                    type="text"
                    value={formData.personalId || ''}
                    onChange={(e) => handleChange('personalId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Country</label>
                  <select
                    value={formData.country || ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select country…</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* COMPANY INFORMATION */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Position / Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => handleChange('position', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department || 'Operations'}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.department ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Management">Management</option>
                    <option value="Administration">Administration</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Date of Hire <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfHire || ''}
                    onChange={(e) => handleChange('dateOfHire', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.dateOfHire ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.dateOfHire && <p className="text-red-500 text-xs mt-1">{errors.dateOfHire}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Date of Termination</label>
                  <input
                    type="date"
                    value={formData.dateOfTermination || ''}
                    onChange={(e) => handleChange('dateOfTermination', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Employment Type</label>
                  <select
                    value={formData.employmentType || 'Full-time'}
                    onChange={(e) => handleChange('employmentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
            </section>

            {/* STATUS & ROLE */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Status & Role
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? true}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active Employee</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isSalesPerson ?? false}
                    onChange={(e) => handleChange('isSalesPerson', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sales Person</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isManager ?? false}
                    onChange={(e) => handleChange('isManager', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Manager / Team Leader</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.hasSystemAccess ?? false}
                    onChange={(e) => handleChange('hasSystemAccess', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Access to System Login</span>
                </label>
              </div>
            </section>

            {/* CONTACT DETAILS */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Work Email {formData.hasSystemAccess && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Personal Email</label>
                  <input
                    type="email"
                    value={formData.personalEmail || ''}
                    onChange={(e) => handleChange('personalEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Work Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Mobile Phone</label>
                  <input
                    type="text"
                    value={formData.mobilePhone || ''}
                    onChange={(e) => handleChange('mobilePhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* PAYROLL */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Payroll (Optional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Salary Type</label>
                  <select
                    value={formData.salaryType || ''}
                    onChange={(e) => handleChange('salaryType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Commission-based">Commission-based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <select
                    value={formData.currency || baseCurrency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Basic Salary</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basicSalary || ''}
                    onChange={(e) => handleChange('basicSalary', parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">IBAN / Bank Account</label>
                  <input
                    type="text"
                    value={formData.iban || ''}
                    onChange={(e) => handleChange('iban', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Tax Code / Fiscal ID</label>
                  <input
                    type="text"
                    value={formData.taxCode || ''}
                    onChange={(e) => handleChange('taxCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </section>

            {/* NOTES */}
            <section>
              <h3 className="text-lg text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Notes
              </h3>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                placeholder="Additional notes about this employee..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </section>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {submitError && (
            <p className="mr-auto text-sm text-red-600 dark:text-red-400">{submitError}</p>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          {mode === 'create' && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save & New'}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
