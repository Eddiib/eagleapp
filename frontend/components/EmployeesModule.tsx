import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Eye, Trash2, Filter, Users, Loader2 } from 'lucide-react';
import { employeesApi } from '../services/employees';
import { useConfirm } from '../context/ConfirmDialog';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  surname: string;
  position: string;
  department: 'Sales' | 'Operations' | 'Accounting' | 'Management' | 'Administration' | 'Other';
  isActive: boolean;
  isSalesPerson: boolean;
  dateOfHire: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  personalId?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  dateOfTermination?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  isManager?: boolean;
  hasSystemAccess?: boolean;
  personalEmail?: string;
  mobilePhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  salaryType?: 'Monthly' | 'Hourly' | 'Commission-based';
  basicSalary?: number;
  currency?: string;
  iban?: string;
  taxCode?: string;
  notes?: string;
}


interface EmployeesModuleProps {
  onEmployeeSelect?: (employee: Employee) => void;
  onEditEmployee?: (employee: Employee) => void;
  onCreateNew?: () => void;
}

export function EmployeesModule({ onEmployeeSelect, onEditEmployee, onCreateNew }: EmployeesModuleProps) {
  const confirmDialog = useConfirm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'passive'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSalesPerson, setFilterSalesPerson] = useState<'all' | 'yes' | 'no'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Employee | null>(null);
  const [newEmployeeData, setNewEmployeeData] = useState<Employee>({
    id: '',
    employeeCode: '',
    firstName: '',
    surname: '',
    position: '',
    department: 'Operations',
    isActive: true,
    isSalesPerson: false,
    dateOfHire: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    employeesApi.getAll()
      .then(setEmployees)
      .catch(err => setLoadError(err.message || 'Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive = 
      filterActive === 'all' || 
      (filterActive === 'active' && emp.isActive) || 
      (filterActive === 'passive' && !emp.isActive);

    const matchesDepartment = 
      filterDepartment === 'all' || 
      emp.department === filterDepartment;

    const matchesSalesPerson = 
      filterSalesPerson === 'all' || 
      (filterSalesPerson === 'yes' && emp.isSalesPerson) || 
      (filterSalesPerson === 'no' && !emp.isSalesPerson);

    return matchesSearch && matchesActive && matchesDepartment && matchesSalesPerson;
  });

  const handleAddEmployee = () => {
    setNewEmployeeData({
      id: '',
      employeeCode: '',
      firstName: '',
      surname: '',
      position: '',
      department: 'Operations',
      isActive: true,
      isSalesPerson: false,
      dateOfHire: '',
      email: '',
      phone: '',
    });
    setModalError(null);
    setShowEmployeeModal(true);
  };

  const handleSaveNewEmployee = async () => {
    if (!newEmployeeData.firstName || !newEmployeeData.email) {
      setModalError('First Name and Email are required.');
      return;
    }
    setSaving(true);
    setModalError(null);
    try {
      const result = await employeesApi.create(newEmployeeData);
      const created = await employeesApi.getById(result.id);
      setEmployees(prev => [...prev, created]);
      setShowEmployeeModal(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNewEmployee = () => {
    setShowEmployeeModal(false);
    setModalError(null);
  };

  const updateNewEmployeeField = (field: keyof Employee, value: string | boolean) => {
    setNewEmployeeData({ ...newEmployeeData, [field]: value });
  };

  const startEditingEmployee = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setEditingDraft({ ...employee });
  };

  const stopEditingEmployee = async () => {
    if (!editingDraft) { setEditingEmployeeId(null); return; }
    try {
      await employeesApi.update(editingDraft.id, editingDraft);
      setEmployees(prev => prev.map(e => e.id === editingDraft.id ? editingDraft : e));
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
    setEditingEmployeeId(null);
    setEditingDraft(null);
  };

  const updateEditingDraft = (field: keyof Employee, value: string | boolean) => {
    if (!editingDraft) return;
    setEditingDraft({ ...editingDraft, [field]: value });
  };

  const removeEmployee = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Remove employee?',
      message: 'This will permanently remove the employee. This cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await employeesApi.delete(id);
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const activeFiltersCount = 
    (filterActive !== 'all' ? 1 : 0) + 
    (filterDepartment !== 'all' ? 1 : 0) + 
    (filterSalesPerson !== 'all' ? 1 : 0);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (loadError) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-red-600">{loadError}</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-gray-900 dark:text-white">Employees</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Manage employee records and HR information
            </p>
          </div>
        </div>

        {/* Search and Filter Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, position, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors relative ${
              showFilters
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-gray-900 dark:text-white">Filter Options</h3>
              <button
                onClick={() => {
                  setFilterActive('all');
                  setFilterDepartment('all');
                  setFilterSalesPerson('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* Active Status Filter */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Employees</option>
                  <option value="active">Active Only</option>
                  <option value="passive">Passive Only</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Departments</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Management">Management</option>
                  <option value="Administration">Administration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Sales Person Filter */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Sales Person</label>
                <select
                  value={filterSalesPerson}
                  onChange={(e) => setFilterSalesPerson(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">Sales Person: Yes</option>
                  <option value="no">Sales Person: No</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="text-gray-900 dark:text-white">{filteredEmployees.length}</span> of{' '}
          <span className="text-gray-900 dark:text-white">{employees.length}</span> employees
        </p>
      </div>

      {/* Employee List - Card Format */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900 dark:text-gray-300">Employee Records</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Complete list of all employees in the system
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleAddEmployee} className="gap-2">
              <Plus className="w-4 h-4" />
              Add New Employee
            </Button>
          </div>

          {filteredEmployees.length > 0 ? (
            <div className="space-y-4">
              {/* Grid Header */}
              <div className="overflow-x-auto">
                <div className="min-w-[1400px]">
                  <div className="grid grid-cols-24 gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                    <div className="col-span-2">Employee Code</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-3">Position</div>
                    <div className="col-span-2">Department</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-2">Phone</div>
                    <div className="col-span-2">Date of Hire</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Sales</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>

                  {/* Employee Rows */}
                  {filteredEmployees.map((employee) => {
                    const isEditing = editingEmployeeId === employee.id;
                    const draft = isEditing ? editingDraft! : employee;

                    return (
                      <div key={employee.id}>
                        {/* Employee Row - Read Mode */}
                        {!isEditing && (
                          <div className="grid grid-cols-24 gap-3 items-center py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2">
                            <div className="col-span-2">
                              <span className="text-gray-900 dark:text-gray-300 text-sm">{employee.employeeCode}</span>
                            </div>
                            <div className="col-span-3">
                              <span className="text-gray-900 dark:text-gray-300 text-sm">
                                {employee.firstName} {employee.surname}
                              </span>
                            </div>
                            <div className="col-span-3 text-gray-600 dark:text-gray-400 text-sm">
                              {employee.position}
                            </div>
                            <div className="col-span-2">
                              <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs">
                                {employee.department}
                              </Badge>
                            </div>
                            <div className="col-span-4 text-gray-600 dark:text-gray-400 text-sm truncate">
                              {employee.email}
                            </div>
                            <div className="col-span-2 text-gray-600 dark:text-gray-400 text-sm">
                              {employee.phone}
                            </div>
                            <div className="col-span-2 text-gray-600 dark:text-gray-400 text-sm">
                              {employee.dateOfHire}
                            </div>
                            <div className="col-span-2">
                              {employee.isActive ? (
                                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <div className="col-span-1 text-gray-600 dark:text-gray-400 text-sm">
                              {employee.isSalesPerson ? 'Yes' : 'No'}
                            </div>
                            <div className="col-span-3 flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onEmployeeSelect?.(employee)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingEmployee(employee)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmployee(employee.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Employee Row - Edit Mode */}
                        {isEditing && (
                          <div className="grid grid-cols-24 gap-3 items-start py-4 border-b border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/10 rounded-lg px-2">
                            <div className="col-span-2">
                              <Input
                                value={draft.employeeCode}
                                onChange={(e) => updateEditingDraft('employeeCode', e.target.value)}
                                placeholder="Code"
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div className="col-span-3 space-y-2">
                              <Input
                                value={draft.firstName}
                                onChange={(e) => updateEditingDraft('firstName', e.target.value)}
                                placeholder="First Name"
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                              <Input
                                value={draft.surname}
                                onChange={(e) => updateEditingDraft('surname', e.target.value)}
                                placeholder="Surname"
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                value={draft.position}
                                onChange={(e) => updateEditingDraft('position', e.target.value)}
                                placeholder="Position"
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div className="col-span-2">
                              <select
                                value={draft.department}
                                onChange={(e) => updateEditingDraft('department', e.target.value)}
                                className="h-9 w-full px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                <option value="Sales">Sales</option>
                                <option value="Operations">Operations</option>
                                <option value="Accounting">Accounting</option>
                                <option value="Management">Management</option>
                                <option value="Administration">Administration</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={draft.email}
                                onChange={(e) => updateEditingDraft('email', e.target.value)}
                                placeholder="Email"
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                value={draft.phone}
                                onChange={(e) => updateEditingDraft('phone', e.target.value)}
                                placeholder="Phone"
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="date"
                                value={draft.dateOfHire}
                                onChange={(e) => updateEditingDraft('dateOfHire', e.target.value)}
                                className="h-9 text-sm bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={draft.isActive}
                                  onChange={(e) => updateEditingDraft('isActive', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                              </label>
                            </div>
                            <div className="col-span-1">
                              <input
                                type="checkbox"
                                checked={draft.isSalesPerson}
                                onChange={(e) => updateEditingDraft('isSalesPerson', e.target.checked)}
                                className="w-4 h-4"
                              />
                            </div>
                            <div className="col-span-3 flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={stopEditingEmployee}
                                className="h-8 text-xs"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h4 className="text-gray-900 dark:text-gray-300 mb-2">No Employees Found</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {searchTerm || activeFiltersCount > 0
                    ? 'No employees match your search or filter criteria'
                    : 'Get started by adding your first employee'}
                </p>
                <Button type="button" variant="outline" onClick={handleAddEmployee} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Employee
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Employee Modal */}
      <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the employee details. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="modal-employee-code">
                Employee Code
              </Label>
              <Input
                id="modal-employee-code"
                value={newEmployeeData.employeeCode}
                onChange={(e) => updateNewEmployeeField('employeeCode', e.target.value)}
                placeholder="e.g., EMP011"
              />
            </div>

            <div>
              <Label htmlFor="modal-first-name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="modal-first-name"
                value={newEmployeeData.firstName}
                onChange={(e) => updateNewEmployeeField('firstName', e.target.value)}
                placeholder="e.g., John"
              />
            </div>

            <div>
              <Label htmlFor="modal-surname">
                Surname
              </Label>
              <Input
                id="modal-surname"
                value={newEmployeeData.surname}
                onChange={(e) => updateNewEmployeeField('surname', e.target.value)}
                placeholder="e.g., Smith"
              />
            </div>

            <div>
              <Label htmlFor="modal-position">
                Position
              </Label>
              <Input
                id="modal-position"
                value={newEmployeeData.position}
                onChange={(e) => updateNewEmployeeField('position', e.target.value)}
                placeholder="e.g., Sales Manager"
              />
            </div>

            <div>
              <Label htmlFor="modal-department">
                Department
              </Label>
              <select
                id="modal-department"
                value={newEmployeeData.department}
                onChange={(e) => updateNewEmployeeField('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="Accounting">Accounting</option>
                <option value="Management">Management</option>
                <option value="Administration">Administration</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="modal-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={newEmployeeData.email}
                onChange={(e) => updateNewEmployeeField('email', e.target.value)}
                placeholder="e.g., john.smith@eagleshipping.com"
              />
            </div>

            <div>
              <Label htmlFor="modal-phone">
                Phone
              </Label>
              <Input
                id="modal-phone"
                value={newEmployeeData.phone}
                onChange={(e) => updateNewEmployeeField('phone', e.target.value)}
                placeholder="e.g., +383 44 123 456"
              />
            </div>

            <div>
              <Label htmlFor="modal-date-of-hire">
                Date of Hire
              </Label>
              <Input
                id="modal-date-of-hire"
                type="date"
                value={newEmployeeData.dateOfHire}
                onChange={(e) => updateNewEmployeeField('dateOfHire', e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEmployeeData.isActive}
                  onChange={(e) => updateNewEmployeeField('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active Employee</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEmployeeData.isSalesPerson}
                  onChange={(e) => updateNewEmployeeField('isSalesPerson', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Sales Person</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            {modalError && (
              <span className="text-sm text-red-600 dark:text-red-400 mr-auto">{modalError}</span>
            )}
            <Button type="button" variant="outline" onClick={handleCancelNewEmployee} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveNewEmployee} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}