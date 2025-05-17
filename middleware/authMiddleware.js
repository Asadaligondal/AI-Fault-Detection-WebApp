const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'no token provided'
        })
    }

    try {
        const decode = jwt.verify(token, "my_super_secure_random_key_12345");
        req.user = decode;
        next();
    } catch (error) {
        console.log("error in auth middleware", error)
        return res.status(401).json({
            success: false,
            message: 'invalid token'
        })
    }

}
module.exports = authMiddleware;