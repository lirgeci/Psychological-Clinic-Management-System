import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { ActivityIcon } from 'lucide-react';
import { toast } from 'sonner';
export function Register() {
  const navigate = useNavigate();
  const { addEntity } = useStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
  {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';else
    if (!/\S+@\S+\.\S+/.test(formData.email))
    newErrors.email = 'Email is invalid';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.dateOfBirth)
    newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.password) newErrors.password = 'Password is required';else
    if (formData.password.length < 6)
    newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)
    newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Create User record
      const userId = Math.random().toString(36).substr(2, 9);
      const newUser = {
        id: userId,
        email: formData.email,
        password: formData.password,
        role: 'patient' as const,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };
      // Create Patient record
      const newPatient = {
        userId,
        ...newUser,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as any,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        registrationDate: new Date().toISOString().split('T')[0]
      };
      addEntity('users', newUser);
      addEntity('patients', newPatient);
      toast.success('Registration successful! Please log in.');
      navigate('/');
    } else {
      toast.error('Please fix the errors in the form.');
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <ActivityIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900">
            Patient Registration
          </h2>
          <p className="mt-2 text-slate-600">
            Create your account to book appointments and manage your care.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName} />
              
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName} />
              
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email} />
              
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone} />
              
              <Input
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                error={errors.dateOfBirth} />
              
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                error={errors.gender}
                options={[
                {
                  label: 'Male',
                  value: 'Male'
                },
                {
                  label: 'Female',
                  value: 'Female'
                },
                {
                  label: 'Other',
                  value: 'Other'
                },
                {
                  label: 'Prefer not to say',
                  value: 'Prefer not to say'
                }]
                } />
              
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address} />
                
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Emergency Contact (Name & Phone)"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  error={errors.emergencyContact} />
                
              </div>
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password} />
              
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword} />
              
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Link
                to="/"
                className="text-sm font-medium text-blue-600 hover:text-blue-500">
                
                &larr; Back to Login
              </Link>
              <Button type="submit">Register Account</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>);

}