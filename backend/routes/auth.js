import express, { response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js'; // Ensure this is an ES module
import fetchuser from '../middleware/fetchuser.js';

const router = express.Router();

const JWT_SECRET = "thisissecretsign;";

let success = false;

// Route 1: Create user using post "/api/auth/createuser"
router.post(
  '/createuser',
  [
    body('name')
      .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces')
      .custom((value) => {
        
        const nameParts = value.trim().split(/\s+/);
        if (nameParts.length < 2) {
          throw new Error('Please enter your full name (first name and last name)');
        }
        
        if (nameParts.some(part => part.length < 2)) {
          throw new Error('Each part of the name must be at least 2 characters long');
        }
        return true;
      }),
    body('email').isEmail().withMessage('Invalid Email Address'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
    body('phone').isMobilePhone().withMessage('Invalid Phone Number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      existingUser = await User.findOne({ phone: req.body.phone });
      if (existingUser) {
        return res.status(400).json({ error: 'Phone number already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        phone: req.body.phone,
        type: req.body.type
      });

      const userdata = {
        user: {
          id: user.id,
          type: user.type
        }
      }

      const authToken = jwt.sign(userdata, JWT_SECRET);

      res.json({ authToken });
    }
    catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }

    // res.status(201).json({ message: 'User created successfully', user });
  }
);


// Route 2: Authenticate a user using: POST "/api/auth/login"
router.post('/login', [
  body('email').isEmail().withMessage("Invalid Email"),
  body('password').isLength({ min: 5 }).withMessage("Password must be 5 characters long")
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success, error: "Please use correct credentials." })
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.status(400).json({ success, error: "Please use correct credentials." })
    }

    const userdata = {
      user: {
        id: user.id,
        type: user.type
      }
    }

    const authToken = jwt.sign(userdata, JWT_SECRET);
    res.json({ success: true, authToken, userType: user.type });
  }
  catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})


//Route 3: Authenticate a user using: POST "/api/auth/getuser"
router.post('/getuser', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }

})


//Route 4: Get all user using: GET "/api/auth/getalluser"
router.get('/getalluser', fetchuser, async (req, res) => {
  try {
    // Check if the user is an admin or has the necessary permissions.
    const currentUser = await User.findById(req.user.id);

    if (!currentUser || currentUser.type !== 'Manager') { // adjust 'admin' as needed
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const users = await User.find().select("-password -__v");
    res.json(users);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//Route 5: Get existing user using id: get "/api/auth/getuserbyid"
router.get('/getuserbyid/:id', fetchuser, async (req, res) => {
  try {
    // Check if the user is authorized (only managers or the user themselves)
    const currentUser = await User.findById(req.user.id);
    const requestedUserId = req.params.id;

    // Allow access if the current user is a Manager or if they're requesting their own data
    if (!currentUser || (currentUser.type !== 'Manager' && currentUser._id.toString() !== requestedUserId)) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Fetch the user by ID
    const user = await User.findById(requestedUserId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});


//Route 5: Update existing user: PUT "/api/auth/updateuser"
router.put('/updateuser/:id', fetchuser, [
  body('name')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces')
    .custom((value) => {
      // Check if there are at least two words (first name and last name)
      const nameParts = value.trim().split(/\s+/);
      if (nameParts.length < 2) {
        throw new Error('Please enter your full name (first name and last name)');
      }
      // Check if each part is at least 2 characters long
      if (nameParts.some(part => part.length < 2)) {
        throw new Error('Each part of the name must be at least 2 characters long');
      }
      return true;
    }),
  body('email').isEmail().withMessage('Invalid Email Address'),
  // Make password optional, but if provided, it must be at least 5 characters
  body('password').optional().isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  body('phone').isMobilePhone().withMessage('Invalid Phone Number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, phone, type } = req.body;

    const updatedUser = {};
    if (name) { updatedUser.name = name; }
    if (email) { updatedUser.email = email; }
    if (phone) { updatedUser.phone = phone; }
    if (type) { updatedUser.type = type; }

    // Only hash and update password if it's provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedUser.password = await bcrypt.hash(password, salt);
    }

    // Check if the user is an admin or has the necessary permissions.
    const currentUser = await User.findById(req.user.id);

    if (!currentUser || (currentUser.type !== 'Manager' && currentUser.type !== 'Admin')) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("Not Found");
    }

    user = await User.findByIdAndUpdate(req.params.id, { $set: updatedUser }, { new: true }).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
})


//Route 6: Delete existing user: DELETE "/api/auth/deleteuser"
router.delete('/deleteuser/:id', fetchuser, async (req, res) => {
  try {
    // Check if the user is an admin or has the necessary permissions.
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser || (currentUser.type !== 'Manager' && currentUser.type !== 'Admin')) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Check if user exists
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent managers from deleting themselves
    // if (currentUser._id.toString() === req.params.id) {
    //   return res.status(400).json({ error: "You cannot delete your own account" });
    // }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    
    // Send success response
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/getassigner/:id', fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");
    res.json(user.name);
  }
  catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})        
export default router; 
