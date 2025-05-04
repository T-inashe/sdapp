import React from 'react';
import { useState, ChangeEvent, FormEvent, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './signup.css';
import config from '../../config';
import AuthContext from '../../context/AuthContext'; // Assuming you have this context

interface FormData {
  role: 'Researcher' | 'Admin' | 'Reviewer';
  contact: string;
  department: string;
  academicrole: 'Student' | 'Lecturer' | 'Academic Researcher';
  researcharea: string;
  researchExperience: 'Bachelor' | 'Honours' | 'Masters' | 'PhD';
}

interface Errors {
  general?: string;
  code?: string;
}

const Signup: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  const id = urlParams.get("userId");
  const { user } = useContext(AuthContext); // Access the user from the AuthContext
  const [formData, setFormData] = useState<FormData>({
    role: 'Researcher',
    contact: '',
    department: '',
    academicrole: 'Student',
    researcharea: '',
    researchExperience: 'Bachelor',
  });
  const [errors, setErrors] = useState<Errors>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!id) {
      console.log("User ID is missing");
      setErrors({ general: 'User ID is missing from the URL.' });
      return <p>User ID is missing from the URL</p>;
    }

    console.log("Submitting form data:", formData); // Log the form data for debugging

    try {
      const response = await axios.put(
        `${config.API_URL}/api/users/${id}`, // Dynamic user ID from the URL
        formData // Send formData as the request body
      );
      
      console.log('Updated user:', response.data); // Log the response from the server
      navigate(`/login`); // Redirect to the login page after successful update
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.response) {
        const errRes = error.response.data;

        // Handle specific error codes
        if (errRes?.code === 'INVALID_EMAIL_DOMAIN') {
          setErrors({ code: 'INVALID_EMAIL_DOMAIN' });
        } else {
          setErrors({ general: errRes?.message || 'Update failed.' });
        }
      } else {
        // Handle cases where there is no response (e.g., network errors)
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const renderRoleFields = () => {
    if (formData.role === 'Researcher') {
      return (
        <>
          <div className="form-group">
            <label htmlFor= "researcharea">Research Area</label>
            <input
              id="researcharea"
              type="text"
              name="researcharea"
              value={formData.researcharea}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="researchExperience">Research Experience</label>
            <select
              id="researchExperience"
              name="researchExperience"
              value={formData.researchExperience}
              onChange={handleChange}
              required
            >
              <option value="Bachelor">Bachelor</option>
              <option value="Honours">Honours</option>
              <option value="Masters">Masters</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
        </>
      );
    } else if (formData.role === 'Reviewer') {
      return (
        <div className="form-group">
          <label htmlFor = "researchExperience">Research Experience</label>
          <select
            id="researchExperience"
            name="researchExperience"
            value={formData.researchExperience}
            onChange={handleChange}
            required
          >
            <option value="Bachelor">Bachelor</option>
            <option value="Honours">Honours</option>
            <option value="Masters">Masters</option>
            <option value="PhD">PhD</option>
          </select>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="signup-container">
      <h1>Hello, {user?.name?.split(' ')[0]}! Please complete your details to proceed..</h1>
      <form onSubmit={handleSubmit}>
        {errors.general && <div className="error">{errors.general}</div>}

        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} required>
            <option value="Researcher">Researcher</option>
            <option value="Admin">Admin</option>
            <option value="Reviewer">Reviewer</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="contact">Contact Number</label>
          <input
            id="contact"
            type="tel"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <input
            id="department"
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="academicrole">Academic Role</label>
          <select
            id="academicrole"
            name="academicrole"
            value={formData.academicrole}
            onChange={handleChange}
            required
          >
            <option value="Student">Student</option>
            <option value="Lecturer">Lecturer</option>
            <option value="Academic Researcher">Academic Researcher</option>
          </select>
        </div>

        {renderRoleFields()}

        <button id="submit" type="submit" className="submit-btn">
          Register
        </button>
      </form>
    </div>
  );
};

export default Signup;
