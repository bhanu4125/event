import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'eventra_super_secret_jwt_key_2026_xyz', {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, year, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Never trust client setting admin arbitrarily unless no admin exists, but allow organizer or student
    const assignedRole = role === 'admin' ? 'admin' : (role === 'organizer' ? 'organizer' : 'student');

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      department: department || 'Engineering',
      year: year || '3rd Year',
      phone: phone || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        phone: user.phone,
        avatar: user.avatar,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const demoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    const targetRole = ['admin', 'organizer', 'student'].includes(role) ? role : 'organizer';
    
    let user = await User.findOne({ role: targetRole });
    if (!user) {
      // Create fallback demo user
      const demoData = {
        admin: { name: 'Campus Admin', email: 'admin@eventra.edu', password: 'password123', role: 'admin', department: 'Administration' },
        organizer: { name: 'Alex Rivera (ACM Lead)', email: 'organizer@eventra.edu', password: 'password123', role: 'organizer', department: 'Computer Science' },
        student: { name: 'Sam Taylor', email: 'student@eventra.edu', password: 'password123', role: 'student', department: 'Information Technology' },
      };
      user = await User.create(demoData[targetRole]);
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        phone: user.phone,
        interests: user.interests || [],
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyInterests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('interests');
    res.json({
      success: true,
      data: user?.interests || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMyInterests = async (req, res) => {
  try {
    const { interests } = req.body;
    if (!Array.isArray(interests)) {
      return res.status(400).json({ success: false, message: 'Interests must be an array of strings' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { interests },
      { new: true, runValidators: true }
    ).select('interests');

    res.json({
      success: true,
      message: 'Interests updated successfully',
      data: user.interests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query.trim(), $options: 'i' } },
        { email: { $regex: query.trim(), $options: 'i' } },
        { department: { $regex: query.trim(), $options: 'i' } },
      ],
    })
      .select('name email department year avatar')
      .limit(10);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

