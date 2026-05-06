import { api } from './client';
import { Employee } from '../components/EmployeesModule';

function toEmployee(row: any): Employee {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    surname: row.surname,
    position: row.position,
    department: row.department,
    isActive: row.is_active === 1 || row.is_active === true,
    isSalesPerson: row.is_sales_person === 1 || row.is_sales_person === true,
    dateOfHire: row.date_of_hire ? row.date_of_hire.split('T')[0] : '',
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth ? row.date_of_birth.split('T')[0] : undefined,
    personalId: row.personal_id,
    gender: row.gender,
    address: row.address,
    city: row.city,
    country: row.country,
    dateOfTermination: row.date_of_termination ? row.date_of_termination.split('T')[0] : undefined,
    employmentType: row.employment_type,
    isManager: row.is_manager === 1 || row.is_manager === true,
    hasSystemAccess: row.has_system_access === 1 || row.has_system_access === true,
    personalEmail: row.personal_email,
    mobilePhone: row.mobile_phone,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    salaryType: row.salary_type,
    basicSalary: row.basic_salary,
    currency: row.currency,
    iban: row.iban,
    taxCode: row.tax_code,
    notes: row.notes,
  };
}

function toApiPayload(e: Partial<Employee>) {
  return {
    employee_code: e.employeeCode,
    first_name: e.firstName,
    surname: e.surname,
    position: e.position,
    department: e.department,
    is_active: e.isActive,
    is_sales_person: e.isSalesPerson,
    date_of_hire: e.dateOfHire || null,
    email: e.email,
    phone: e.phone,
    date_of_birth: e.dateOfBirth || null,
    personal_id: e.personalId,
    gender: e.gender,
    address: e.address,
    city: e.city,
    country: e.country,
    date_of_termination: e.dateOfTermination || null,
    employment_type: e.employmentType,
    is_manager: e.isManager,
    has_system_access: e.hasSystemAccess,
    personal_email: e.personalEmail,
    mobile_phone: e.mobilePhone,
    emergency_contact_name: e.emergencyContactName,
    emergency_contact_phone: e.emergencyContactPhone,
    salary_type: e.salaryType,
    basic_salary: e.basicSalary,
    currency: e.currency,
    iban: e.iban,
    tax_code: e.taxCode,
    notes: e.notes,
  };
}

export const employeesApi = {
  getAll: async (): Promise<Employee[]> => {
    const rows = await api.get<any[]>('/employees');
    return rows.map(toEmployee);
  },
  getById: async (id: string): Promise<Employee> => {
    const row = await api.get<any>(`/employees/${id}`);
    return toEmployee(row);
  },
  create: (data: Partial<Employee>) =>
    api.post<{ id: string }>('/employees', toApiPayload(data)),
  update: (id: string, data: Partial<Employee>) =>
    api.put<{ message: string }>(`/employees/${id}`, toApiPayload(data)),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/employees/${id}`),
};
