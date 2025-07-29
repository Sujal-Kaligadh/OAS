
import jwt from 'jsonwebtoken';

const JWT_SECRET = "thisissecretsign;";

const fetchuser = (req, res, next)=>{
     //Get user from JWT Token and add id to req object

     const token = req.header('auth-token');
     if(!token)
     {
        res.status(401).send({ error: "Please Authenticate using Valid token" });
     }

     try{
        const userdata = jwt.verify(token, JWT_SECRET);
        req.user = userdata.user;
        next();
     }
     catch (error) {
        res.status(401).send({ error: "Please Authenticate using Valid token" });
    }
}

export default fetchuser; 