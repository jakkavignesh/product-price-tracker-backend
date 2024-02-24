const express = require('express')
const app = express();
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const port = 5000;
const cors = require('cors');
app.use(cors());
app.use(express.json());
const jwt = require('jsonwebtoken');

const DB = 'mongodb://localhost:27017/?directConnection=true';
mongoose.connect(DB).then(() => {
    console.log("Connected to MongoDb");
}).catch((err) => {
    console.log(err);
})

const sendEmail = async (name, email) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: "b15productpricetracker@gmail.com",
              pass: "nucvokqwzbgmkogp",
            },
        });
        const mailOptions = {
            from: {
                name: "B15 Product Pricetracker",
                address: "b15productpricetracker@gmail.com"
            },
            to: `${email}`,
            subject: `Welcome ${name} to B15 Product Pricetracker`,
            text: "Thank you for registering to B15 Product Pricetracker"
        }
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    }
    catch(err) {
        console.log(err);
    }
}
const registerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cpassword: {
        type: String,
        required: true
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
})

registerSchema.methods.generateAuthToken = async function () {
    try {
        let token = jwt.sign({_id : this._id}, "Mynameifjvmnelenrfdcefjkjcjk", {expiresIn:3600000});
        this.tokens = this.tokens.concat({token:token});
        await this.save();
        return token;
    }
    catch (err) {
        console.log(err);
    }
}

const database = mongoose.model('userDetails', registerSchema);

app.post('/signup', async (req, res) => {
    const { name, email, password, cpassword } = req.body;
    try {
        const userExists = await database.findOne({email: email});
        if(userExists) {
            return res.json({success: false})
        }
        const user = new database({name, email, password, cpassword});
        const userRegister = await user.save()
        await sendEmail(name, email);
        return res.json({success: true})
    }
    catch(err) {
        return res.send(err.message);
    }
})
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    let token;
    try {
        const userExists = await database.findOne({email: email});
        if(!userExists) {
            return res.json({success: false})
        }
        if(userExists.password === password) {
            token = await userExists.generateAuthToken();
            console.log(token);
            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 25892000000),
                httpOnly: true
            })
            return res.json({success: true, name: userExists.name, email: email});
        }
        else {
            return res.json({success: false});
        }
    }
    catch(err) {
        return res.send(err.message);
    }
})

app.get('/getName', async (req, res) => {
    const userExists = await database.findOne({email: email});
    return res.json({name : userExists.name})
})

app.listen(port, () => {
    console.log(`listening on port ${port}`);
})