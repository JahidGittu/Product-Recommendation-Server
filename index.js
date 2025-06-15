const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());




// Firebase Admin 

var admin = require("firebase-admin");
var serviceAccount = require("./Fb_Admin_Key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});




// Api Validation logger

const logger = (req, res, next) => {
    console.log("inside the logger mmiddleware")
    next();
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token
    console.log("cookie in the middleware", token)

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }

    // verify token

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ message: 'Unauthorized Access' })
        }
        req.decoded = decoded
        next()
    })
}


// Firebase Token Verify

const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers?.authorization
    const token = authHeader.split(' ')[1]
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    // console.log('Fb Token is', token)

    const userInfo = await admin.auth().verifyIdToken(token);
    console.log("inside Fb Token", userInfo);
    req.tokenEmail = userInfo.email;
    next()
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tks1y5a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// Nodemailer transporter (Ensure this is defined globally for email sending)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const queriesCollection = client.db("recommendProduct").collection("queries")


        // recommendations
        const recommendationsCollection = client.db("recommendProduct").collection("recommendations");

        // reviewsCollection
        const reviewsCollection = client.db('recommendProduct').collection('reviews');

        // Subscriber Email
        const subscriptionsCollection = client.db("recommendProduct").collection("subscriptions");




        // app.post('/jwt', async (req, res) => {
        //     const { email } = req.body;
        //     const user = email;
        //     const token = jwt.sign(user, 'secret', { expiresIn: '1h' });
        //     res.send({ token })
        // })


        // app.post('/jwt', async (req, res) => {
        //     const { email } = req.body;

        //     if (!email) {
        //         return res.status(400).json({ message: "Email is required" }); // Ensure email is being sent
        //     }

        //     try {
        //         const token = jwt.sign({ email }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1d' });

        //         res.cookie('token', token, {
        //             httpOnly: true,
        //             secure: false,

        //         });

        //         return res.json({ success: true, token });
        //     } catch (error) {
        //         console.error('JWT Error:', error);
        //         return res.status(500).json({ message: 'Internal server error' });
        //     }
        // });


        // jwt token related api
        app.post('/jwt', async (req, res) => {
            const userData = req.body;

            const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET,
                { expiresIn: '1d' })

            res.cookie('token', token, {
                httpOnly: true,
                secure: false
            })

            res.send({ success: true })
        })







        // Subscribe API
        app.post('/subscribe', async (req, res) => {
            const { email } = req.body;
            console.log("Subscribe Email Is", email)

            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            try {
                // Check if the email is already subscribed
                const existingEmail = await subscriptionsCollection.findOne({ email });

                if (existingEmail) {
                    return res.status(400).json({ message: 'This email is already subscribed' });
                }

                // Save the email to the 'subscriptions' collection in MongoDB
                await subscriptionsCollection.insertOne({ email });

                // Nodemailer email options for subscription confirmation
                const mailOptions = {
                    from: `"Recommend Product" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Subscription to Recommend Product News',
                    html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); color: #333;">
                        <header style="text-align: center; margin-bottom: 25px;">
                            <img src="https://i.ibb.co/rGqtrqnZ/Logo.png" alt="Recommend Product Logo" style="width: 100px; margin-bottom: 15px;" />
                            <h1 style="color: #22c55e; font-size: 28px; margin: 0;">Thanks for subscribing!</h1>
                        </header>

                        <main style="font-size: 16px; line-height: 1.6;">
                            <p>Hi there,</p>
                            <p>Thank you for subscribing to <strong>Recommend Product News</strong>. We're excited to have you onboard!</p>
                            <p>You’ll now receive the latest <span style="color: #22c55e;">news, deals, and expert tips</span> delivered straight to your inbox to help you discover the best products.</p>
                            <p>Feel free to reply to this email if you have any questions or suggestions.</p>
                        </main>

                        <footer style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
                            <p>© 2025 Recommend Product. All rights reserved.</p>
                            <p><a href="https://yourdomain.com/unsubscribe" style="color: #22c55e; text-decoration: none;">Unsubscribe</a> if you no longer wish to receive these emails.</p>
                        </footer>
                    </div>
                    `,
                };

                // Send the confirmation email
                await transporter.sendMail(mailOptions);
                res.status(200).json({ message: 'Subscription successful! Confirmation email sent.' });
            } catch (error) {
                console.error('Error sending email:', error);
                res.status(500).json({ message: 'Failed to send subscription email' });
            }
        });




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("🍽️ “The Server Product for You — Now Cooked to Perfection… with Extra Spice!” 🌶️🔥")
})

app.listen(port, () => {
    console.log(`Server Running On Port ${port}`)
})