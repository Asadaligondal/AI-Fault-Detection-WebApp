const express = require('express');
const router = express.Router();
const User = require('../models/user'); // import the user model
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


router.post('/login', async (req,res)=>{ 
    console.log("Login request successful", req.body)
    const {username, password} = req.body;
    if ( !username || !password){
        console.log("login request failed", req.body)
        return res.status(400).json({
            success: false,
            message: 'please provide valid info'
        })
    }

    // we will check the login from db
    try {
        const exists = await User.findOne({username});
        if (!exists){
            return res.status(401).json({
                success: false,
                message: 'username not found'
            })
        }    
        const isMatch = await bcrypt.compare(password, exists.password);

        if (!isMatch){
            console.log("password is incorrect", req.body)
            return res.status(401).json({
                success: false,
                message: 'password is incorrect'
            })
        }

        // create a token
        const token = jwt.sign({
            id: exists._id, 
            username: exists.username
        }, "my_super_secure_random_key_12345", {expiresIn: '1h'});
        return res.status(200).json({
            success: true,
            message: 'login successful',
            token: token
        })

    } catch (error){
        console.log("error in login", error)
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }

})

router.post('/signup', async (req,res)=>{

    const {username, password} = req.body;
    if (!username || !password){
        console.log("signup request failed", req.body)
        return res.status(400).json({
            success: false,
            message: 'please provide valid info'
        })
    }
    // we will add this data in mongoDB base

    try {

        const existingUser = await User.findOne({username});
        if (existingUser){
            console.log("User already exists", req.body)
            return res.status(409).json({
                success: false,
                message: 'user already exists'
            })
        }

        //else we save it
        const New = new User({ username, password});
        const hashedPassword = await bcrypt.hash(New.password, 10);
        New.password = hashedPassword;
        // save the user in the database
        await New.save();
        console.log("user created succefully", req.body)
        return res.status(201).json({
            success: true,
            message: 'user created successfully'
        })
    } catch (error){
        console.log("error in creating user", error)
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
})

module.exports = router;


