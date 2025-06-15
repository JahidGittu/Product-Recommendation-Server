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






        // Query Post with send email notification

        app.post('/queries', async (req, res) => {
            const newQuery = req.body;
            console.log(newQuery);

            try {
                // Insert the query in the database
                const result = await queriesCollection.insertOne(newQuery);

                // Nodemailer email options for query submission
                const subject = 'New Query Submitted';
                const message = `
            <div style="font-family: 'Arial', sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #007bff; text-align: center;">New Query Submitted</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                    A new query has been submitted by <strong>${newQuery.userEmail}</strong>.
                </p>
                <hr>
                <h3 style="color: #28a745;">Query Details:</h3>
                <p><strong>Query Title:</strong> ${newQuery.queryTitle}</p>
                <p><strong>Product Name:</strong> ${newQuery.productName}</p>
                <p><strong>Reason for Boycott:</strong></p>
                <p style="font-style: italic;">${newQuery.boycottReason}</p>
                <hr>
                <p style="color: #555;">For more details, check the full query in your database.</p>
                <footer style="font-size: 14px; text-align: center; color: #888;">
                    <p>Thanks for using our platform. If you have any questions, feel free to reach out.</p>
                    <p>© 2025 Recommend Product</p>
                </footer>
            </div>
        `;

                // Fetch all subscribers' emails
                const subscribers = await subscriptionsCollection.find().toArray();
                const subscriberEmails = subscribers.map(subscriber => subscriber.email);

                // Send email notification to all subscribers
                if (subscriberEmails.length > 0) {
                    for (let email of subscriberEmails) {
                        const mailOptions = {
                            from: `"Recommend Product" <${process.env.EMAIL_USER}>`,
                            to: newQuery.userEmail,
                            subject: subject,
                            html: message, // HTML formatted email for the query submission
                        };

                        try {
                            await transporter.sendMail(mailOptions);
                            console.log(`Email sent to subscriber: ${email}`);
                        } catch (emailError) {
                            console.error(`Error sending email to ${email}:`, emailError);
                            return res.status(500).json({ error: 'Failed to send email to some subscribers' });
                        }
                    }
                }

                res.send(result); // Return the query result
            } catch (error) {
                console.error('Error handling query submission:', error);
                res.status(500).json({ error: 'Failed to submit query' });
            }
        });



        // GET: Get queries by user email
        app.get("/queries", logger, verifyToken, verifyFirebaseToken, async (req, res) => {

            const email = req.query.email;

            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbiden Access' })
            }

            if (req.tokenEmail != email) {
                return res.status(403).send({ message: 'Forbiden Access' })
            }

            // console.log("inside the application api", req.cookies)

            if (email) {
                const result = await queriesCollection.find({ userEmail: email }).toArray();
                return res.send(result);
            }
            const result = await queriesCollection.find().toArray();
            res.send(result);
        });



        // GET: Get recent queries or queries by email
        app.get("/queries/recents", async (req, res) => {
            const email = req.query.email;
            const limit = parseInt(req.query.limit) || 5;

            const query = email ? { userEmail: email } : {};

            const result = await queriesCollection
                .find(query)
                .sort({ timestamp: -1 }) // latest first
                .limit(limit)
                .toArray();

            res.send(result);
        });




        // DELETE: Delete a query by id
        app.delete('/queries/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const toDelete = { _id: new ObjectId(id) };
            const result = await queriesCollection.deleteOne(toDelete);
            res.send(result);
        });





        // Read (details by ID)
        app.get('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const post = await queriesCollection.findOne(query);
            res.send(post);
        });


        //  Increment Recommendation Count for a Query
        app.patch('/queries/:id/incrementRecommendation', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const update = {
                $inc: { recommendationCount: 1 }
            };
            const result = await queriesCollection.updateOne(query, update);
            res.send(result);
        });


        // Update Query
        app.patch('/queries/:id', async (req, res) => {
            const { id } = req.params;
            const updates = req.body;

            try {
                if (updates.increment) {
                    const result = await queriesCollection.updateOne(
                        { _id: new ObjectId(id) },
                        { $inc: { recommendationCount: 1 } }
                    );
                    if (result.matchedCount === 0) {
                        return res.status(404).json({ error: 'Query not found' });
                    }
                    return res.json({ modifiedCount: result.modifiedCount });
                }

                const result = await queriesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updates }
                );
                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Query not found' });
                }
                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
            }
        });




        // top and letest bes query with reco
        // GET /queries-with-recommendations
        app.get('/queries-with-recommendations', async (req, res) => {
            try {
                // ১) সব recommendations থেকে unique queryId গুলো বের করবো
                const recommendations = await recommendationsCollection.find().toArray();

                // queryId গুলো unique রেখে বের করো
                const queryIds = [...new Set(recommendations.map(r => r.queryId))];

                // ২) ঐ queryId গুলো দিয়ে queries collection থেকে ডেটা আনো
                // ObjectId না হলে string হিসেবে queryId থাকলে সেটা একইভাবে handle করতে হবে
                const objectIds = queryIds.map(id => {
                    try {
                        return new ObjectId(id);
                    } catch {
                        return id; // যদি ObjectId না হয়, তো string হিসাবে রাখো
                    }
                });

                const queries = await queriesCollection.find({
                    _id: { $in: objectIds }
                }).toArray();

                // ৩) recommendations গুলোকে queryId অনুসারে গ্রুপ করো
                const recommendationsByQuery = {};
                queryIds.forEach(id => {
                    recommendationsByQuery[id] = recommendations.filter(r => r.queryId === id);
                });

                // ৪) রেসপন্সে দুইটা পাঠাও
                res.json({
                    queries,
                    recommendationsByQuery
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Server error fetching queries and recommendations' });
            }
        });





        // recommendations Post
        // app.post('/recommendations', async (req, res) => {
        //     const recommendation = {
        //         ...req.body,
        //         likes: req.body.likes ?? [],
        //         comments: req.body.comments ?? [],
        //     };
        //     const result = await recommendationsCollection.insertOne(recommendation);
        //     res.send(result);
        // });


        // POST: Add a recommendation and send email notification to subscribers
        app.post('/recommendations', async (req, res) => {
            const newRecommendation = req.body;
            console.log("New Recommendation:", newRecommendation);

            try {
                // Insert the recommendation into the database
                const result = await recommendationsCollection.insertOne(newRecommendation);

                // Nodemailer email options for recommendation submission
                const subject = 'New Recommendation Submitted';
                const message = `
            <div style="font-family: 'Arial', sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #007bff; text-align: center;">New Recommendation Submitted</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                    A new recommendation has been submitted by <strong>${newRecommendation.userEmail}</strong> regarding the following product:
                </p>
                <hr>
                <h3 style="color: #28a745;">Recommendation Details:</h3>
                <p><strong>Recommendation Title:</strong> ${newRecommendation.recommendationTitle}</p>
                <p><strong>Product Name:</strong> ${newRecommendation.productName}</p>
                <p><strong>Reason for Recommendation:</strong></p>
                <p style="font-style: italic;">${newRecommendation.recommendationReason}</p>
                <hr>
                <p style="color: #555;">For more details, check the full recommendation in your database.</p>
                <footer style="font-size: 14px; text-align: center; color: #888;">
                    <p>Thanks for using our platform. If you have any questions, feel free to reach out.</p>
                    <p>© 2025 Recommend Product</p>
                </footer>
            </div>
        `;

                // Fetch all subscribers' emails
                const subscribers = await subscriptionsCollection.find().toArray();
                const subscriberEmails = subscribers.map(sub => sub.email);

                // Send email notification to all subscribers
                if (subscriberEmails.length > 0) {
                    for (let email of subscriberEmails) {
                        const mailOptions = {
                            from: `"Recommend Product" <${process.env.EMAIL_USER}>`,
                            to: email, // Send to each subscriber
                            subject: subject,
                            html: message, // HTML formatted email for the recommendation submission
                        };

                        try {
                            await transporter.sendMail(mailOptions);
                            console.log(`Email sent to subscriber: ${email}`);
                        } catch (emailError) {
                            console.error(`Error sending email to ${email}:`, emailError);
                            return res.status(500).json({ error: 'Failed to send email to some subscribers' });
                        }
                    }
                }

                res.send(result); // Return the recommendation result
            } catch (error) {
                console.error('Error handling recommendation submission:', error);
                res.status(500).json({ error: 'Failed to submit recommendation' });
            }
        });


        app.post('/recommendations/by-ids', async (req, res) => {
            const { ids = [], excludeEmail } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.json([]);
            }

            try {

                const objIds = ids.map(id => new ObjectId(id));

                const filter = { queryId: { $in: objIds } };
                if (excludeEmail) filter.recommenderEmail = { $ne: excludeEmail };

                const recs = await recommendationsCollection.find(filter).toArray();
                res.json(recs);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Server error while fetching recommendations' });
            }
        });


        // GET /recommendations  — filter by queryId **OR** recommenderEmail
        app.get('/recommendations', async (req, res) => {
            const { queryId, recommenderEmail } = req.query;

            if (!queryId && !recommenderEmail) {
                return res
                    .status(400)
                    .json({ error: 'queryId or recommenderEmail is required' });
            }

            const filter = {};
            if (queryId) filter.queryId = queryId;
            if (recommenderEmail) filter.recommenderEmail = recommenderEmail;

            const recs = await recommendationsCollection.find(filter).toArray();
            res.send(recs);
        });





        app.get('/recommendations/for-me', async (req, res) => {
            const userEmail = req.query.email;
            if (!userEmail) return res.status(400).json({ error: 'email missing' });

            try {

                const qIds = await queriesCollection
                    .find({ userEmail })
                    .project({ _id: 1 })
                    .toArray();

                if (!qIds.length) return res.json([]);

                const objIds = qIds.map(q => q._id);
                const strIds = objIds.map(id => id.toString());

                const recs = await recommendationsCollection.find({
                    recommenderEmail: { $ne: userEmail },
                    $or: [
                        { queryId: { $in: objIds } },
                        { queryId: { $in: strIds } }
                    ]
                }).toArray();

                res.json(recs);
            } catch (e) {
                console.error(e);
                res.status(500).json({ error: 'Server error' });
            }
        });




        // 1) DELETE a recommendation and decrement its query's recommendationCount
        app.delete('/recommendations/:id', async (req, res) => {
            const recId = req.params.id;

            try {
                // 1. Fetch the recommendation to get its queryId
                const rec = await recommendationsCollection.findOne({ _id: new ObjectId(recId) });
                if (!rec) {
                    return res.status(404).json({ error: 'Recommendation not found' });
                }

                await recommendationsCollection.deleteOne({ _id: new ObjectId(recId) });

                await queriesCollection.updateOne(
                    { _id: new ObjectId(rec.queryId) },
                    { $inc: { recommendationCount: -1 } }
                );

                res.json({ success: true });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Server error' });
            }
        });


        // 2) PATCH a query: either increment/decrement its recommendationCount or set other fields
        app.patch('/queries/:id', async (req, res) => {
            const { id } = req.params;
            const { increment, decrement, ...updates } = req.body;

            try {
                let result;

                if (increment) {
                    // increment recommendationCount by 1
                    result = await queriesCollection.updateOne(
                        { _id: new ObjectId(id) },
                        { $inc: { recommendationCount: 1 } }
                    );
                } else if (decrement) {
                    // decrement recommendationCount by 1
                    result = await queriesCollection.updateOne(
                        { _id: new ObjectId(id) },
                        { $inc: { recommendationCount: -1 } }
                    );
                } else {
                    // set any other provided fields
                    result = await queriesCollection.updateOne(
                        { _id: new ObjectId(id) },
                        { $set: updates }
                    );
                }

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Query not found' });
                }
                res.json({ modifiedCount: result.modifiedCount });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Server error' });
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