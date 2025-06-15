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

app.use(cors());
app.use(express.json());


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




// Firbase Admin 

const admin = require("firebase-admin");
const serviceAccount = require("./Fb_Admin_Key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});




// Verify FireBase Token

const verifyFireBaseToken = async (req, res, next) => {

    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }

    const token = authHeader.split(' ')[1];
    console.log("token in middleware", token)

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token)
        console.log('decoded token', decoded)
        req.decoded = decoded
        next()
    }
    catch (error) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }



}





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


        // GET: Get all public queries (No token required)
        app.get("/queries/all", async (req, res) => {
            try {
                const queries = await queriesCollection.find().toArray();

                if (queries.length === 0) {
                    return res.status(404).json({ message: 'No queries found' });
                }

                res.json(queries); // Return all public queries
            } catch (error) {
                console.error("Error fetching all queries:", error);
                res.status(500).json({ message: "Server error while fetching all queries" });
            }
        });




        // GET: Get queries by user email
        app.get("/queries", verifyFireBaseToken, async (req, res) => {

            // console.log("inside apis", req.headers)

            const email = req.query.email;

            // console.log("inside the application api", req.cookies)


            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbiden Access' })
            }

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
        // app.get('/queries/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };
        //     const post = await queriesCollection.findOne(query);
        //     res.send(post);
        // });


        // GET: Get a single query
        app.get('/queries/:id', verifyFireBaseToken, async (req, res) => {
            const queryId = req.params.id;
            const userEmail = req.headers['user-email'];
            console.log(userEmail)

            if (userEmail !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access' });
            }

            try {
                const query = await queriesCollection.findOne({ _id: new ObjectId(queryId) });
                if (!query) {
                    return res.status(404).send({ message: 'Query not found' });
                }
                res.send(query);
            } catch (error) {
                res.status(500).send({ message: 'Server error fetching query' });
            }
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
        // app.get('/recommendations', verifyFireBaseToken, async (req, res) => {
        //     const { queryId, recommenderEmail } = req.query;

        //     const userEmail = recommenderEmail;
        //     console.log(userEmail)

        //     if (userEmail !== req.decoded.email) {
        //         return res.status(403).send({ message: 'Forbiden Access' })
        //     }


        //     if (!queryId && !recommenderEmail) {
        //         return res
        //             .status(400)
        //             .json({ error: 'queryId or recommenderEmail is required' });
        //     }

        //     const filter = {};
        //     if (queryId) filter.queryId = queryId;
        //     if (recommenderEmail) filter.recommenderEmail = recommenderEmail;

        //     const recs = await recommendationsCollection.find(filter).toArray();
        //     res.send(recs);
        // });


        // GET /recommendations — filter by queryId or recommenderEmail
        app.get('/recommendations', verifyFireBaseToken, async (req, res) => {
            const { queryId, recommenderEmail } = req.query;

            // Firebase থেকে ডিকোড করা ইমেইল
            const userEmail = req.decoded.email;

            // Verify if the recommenderEmail is the same as the logged in user's email
            if (recommenderEmail && recommenderEmail !== userEmail) {
                return res.status(403).send({ message: 'Forbidden Access' });
            }

            if (!queryId && !recommenderEmail) {
                return res.status(400).json({ error: 'queryId or recommenderEmail is required' });
            }

            const filter = {};
            if (queryId) filter.queryId = queryId;
            if (recommenderEmail) filter.recommenderEmail = recommenderEmail;

            try {
                const recs = await recommendationsCollection.find(filter).toArray();
                res.send(recs);
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                res.status(500).json({ error: 'Error fetching recommendations' });
            }
        });



        app.get('/recommendations/for-me', verifyFireBaseToken, async (req, res) => {
            const userEmail = req.query.email;

            if (userEmail !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbiden Access' })
            }

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










        // Like/Unlike a Recommendation
        // app.patch('/recommendations/:id/like', async (req, res) => {
        //     const { userEmail } = req.body;
        //     const recommendationId = new ObjectId(req.params.id);

        //     const recommendation = await recommendationsCollection.findOne({ _id: recommendationId });
        //     if (!recommendation) return res.status(404).send({ error: 'Recommendation not found' });

        //     const alreadyLiked = recommendation.likes?.includes(userEmail);

        //     const update = alreadyLiked
        //         ? { $pull: { likes: userEmail } }
        //         : { $addToSet: { likes: userEmail } };

        //     await recommendationsCollection.updateOne({ _id: recommendationId }, update);

        //     const updated = await recommendationsCollection.findOne({ _id: recommendationId });
        //     res.send({ likes: updated.likes });
        // });


        // Like/Unlike a Recommendation and notify subscribers (Simplified)
        app.patch('/recommendations/:id/like', async (req, res) => {
            const { userEmail } = req.body;
            const recommendationId = new ObjectId(req.params.id);

            try {
                const recommendation = await recommendationsCollection.findOne({ _id: recommendationId });
                if (!recommendation) return res.status(404).send({ error: 'Recommendation not found' });

                // Check if the user has already liked the recommendation
                const alreadyLiked = recommendation.likes?.includes(userEmail);

                // Prepare the update query based on like/unlike
                const update = alreadyLiked
                    ? { $pull: { likes: userEmail } }
                    : { $addToSet: { likes: userEmail } };

                // Apply the update to the recommendation
                await recommendationsCollection.updateOne({ _id: recommendationId }, update);

                // Fetch the updated recommendation
                const updated = await recommendationsCollection.findOne({ _id: recommendationId });

                // Prepare the email content for subscribers
                const subject = `${userEmail} Liked a Recommendation`;
                const message = `
            <div style="font-family: 'Arial', sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #007bff; text-align: center;">A Recommendation Was Liked</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                    The recommendation titled "<strong>${updated.recommendationTitle}</strong>" has been liked by <strong>${userEmail}</strong>.
                </p>
                <footer style="font-size: 14px; text-align: center; color: #888;">
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
                            from: `"Recommend Product" <${process.env.EMAIL_USER}>`, // Use display name and email
                            to: email, // Send to each subscriber
                            subject: subject,
                            html: message, // HTML formatted email for the liked recommendation
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

                res.send({ likes: updated.likes }); // Return the updated likes array
            } catch (error) {
                console.error('Error handling like/unlike action:', error);
                res.status(500).json({ error: 'Failed to update likes' });
            }
        });




        // /* ---------- Add a comment ---------- */
        // app.post('/recommendations/:id/comment', async (req, res) => {
        //     const recommendationId = new ObjectId(req.params.id);
        //     const { user, text, timestamp } = req.body;

        //     const comment = { _id: new ObjectId(), user, text, timestamp };

        //     const result = await recommendationsCollection.updateOne(
        //         { _id: recommendationId },
        //         { $push: { comments: comment } }
        //     );
        //     res.send({ acknowledged: result.acknowledged, comment });
        // });


        /* ---------- Add a comment ---------- */
        app.post('/recommendations/:id/comment', async (req, res) => {
            const recommendationId = new ObjectId(req.params.id);
            const { user, text } = req.body; // Removed timestamp, as it's not needed for email notification

            // Create the comment object
            const comment = { user, text };

            try {
                // Insert the comment into the recommendation's comments array
                const result = await recommendationsCollection.updateOne(
                    { _id: recommendationId },
                    { $push: { comments: comment } }
                );

                // Fetch the recommendation details
                const recommendation = await recommendationsCollection.findOne({ _id: recommendationId });

                // Fetch the associated query details from the queries collection
                const query = await queriesCollection.findOne({ _id: new ObjectId(recommendation.queryId) });

                // Fetch all subscribers' emails
                const subscribers = await subscriptionsCollection.find().toArray();
                const subscriberEmails = subscribers.map(subscriber => subscriber.email);

                // Prepare email content for subscribers with query and recommendation details
                const subject = 'New Comment Added on Recommendation';
                const message = `
            <div style="font-family: 'Arial', sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between;">
                <!-- Left Column: Query details -->
                <div style="width: 45%; padding: 20px; background-color: #e0f7fa; border-radius: 8px;">
                    <h3 style="color: #007bff;">Query</h3>
                    <p><strong>Title:</strong> ${query.queryTitle}</p>
                    <p><strong>Product Name:</strong> ${query.productName}</p>
                    <p><strong>Reason for Boycott:</strong> ${query.boycottReason}</p>
                </div>

                <!-- Right Column: Recommendation and Comment details -->
                <div style="width: 45%; padding: 20px; background-color: #ffeb3b; border-radius: 8px;">
                    <h3 style="color: #007bff;">Recommendation</h3>
                    <p><strong>Recommendation ID:</strong> ${recommendation._id}</p>
                    <p><strong>Recommendation Title:</strong> ${recommendation.recommendationTitle}</p>
                    <p><strong>Recommendation Details:</strong> ${recommendation.recommendationReason}</p>

                    <h3 style="color: #28a745;">New Comment</h3>
                    <p><strong>Added by:</strong> ${user}</p>
                    <p><strong>Comment:</strong> ${text}</p>
                </div>
            </div>
            <footer style="font-size: 14px; text-align: center; color: #888; margin-top: 20px;">
                <p>© 2025 Recommend Product</p>
            </footer>
        `;

                // Send email notification to all subscribers
                if (subscriberEmails.length > 0) {
                    for (let email of subscriberEmails) {
                        const mailOptions = {
                            from: `"Recommend Product" <${process.env.EMAIL_USER}>`, // Use your email or application name here
                            to: email,
                            subject: subject,
                            html: message, // HTML formatted email for the comment notification
                        };

                        try {
                            await transporter.sendMail(mailOptions);
                            console.log(`Email sent to subscriber: ${email}`);
                        } catch (emailError) {
                            console.error(`Error sending email to ${email}:`, emailError);
                        }
                    }
                }

                // Send back the response with just the user and text of the comment
                res.send({
                    acknowledged: result.acknowledged,
                    comment: { user, text },
                });

            } catch (error) {
                console.error('Error adding comment:', error);
                res.status(500).json({ error: 'Failed to add comment' });
            }
        });




        /* ---------- Edit a comment ---------- */
        app.patch('/recommendations/:recId/comment/:cmtId', async (req, res) => {
            const recId = new ObjectId(req.params.recId);
            const cmtId = new ObjectId(req.params.cmtId);
            const { text } = req.body;

            const result = await recommendationsCollection.updateOne(
                { _id: recId, 'comments._id': cmtId },
                { $set: { 'comments.$.text': text } }
            );
            res.send({ acknowledged: result.acknowledged });
        });

        /* ---------- Delete a comment ---------- */
        app.delete('/recommendations/:recId/comment/:cmtId', async (req, res) => {
            const recId = new ObjectId(req.params.recId);
            const cmtId = new ObjectId(req.params.cmtId);

            const result = await recommendationsCollection.updateOne(
                { _id: recId },
                { $pull: { comments: { _id: cmtId } } }
            );
            res.send({ acknowledged: result.acknowledged });
        });



        // single recommendation with likes and comments
        // app.get('/recommendations/:id', async (req, res) => {
        //     const recommendation = await recommendationsCollection.findOne({ _id: new ObjectId(req.params.id) });
        //     res.send(recommendation);
        // });



        // Get Featured Recommendations
        app.get('/recommendations/featured', async (req, res) => {
            try {
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

                // সব ডেটা আনো
                const all = await recommendationsCollection.find({}).toArray();

                const featured = all.filter(rec => {
                    const hasLikes = Array.isArray(rec.likes) && rec.likes.length > 0;
                    const hasComments = Array.isArray(rec.comments) && rec.comments.length > 0;

                    let isRecent = false;
                    try {
                        const recDate = new Date(rec.timestamp);
                        isRecent = recDate >= oneWeekAgo;
                    } catch (e) {
                        isRecent = false;
                    }

                    return hasLikes || hasComments || isRecent;
                });

                const limited = featured
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 6);

                res.send(limited);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch featured recommendations' });
            }
        });





        app.get('/recommendations/top-rated', async (req, res) => {
            try {
                const topRecommendations = await recommendationsCollection.aggregate([
                    {
                        $addFields: {
                            likesCount: { $size: { $ifNull: ["$likes", []] } }
                        }
                    },
                    { $sort: { likesCount: -1, timestamp: -1 } },
                    { $limit: 6 }
                ]).toArray();

                res.json(topRecommendations);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch top rated recommendations' });
            }
        });





        app.get('/stats', async (req, res) => {
            try {
                await client.connect();
                const db = client.db('recommendProduct');

                const queriesCount = await db.collection('queries').countDocuments();
                const recommendationsCount = await db.collection('recommendations').countDocuments();

                // Step 1: Get unique emails from 'queries' collection
                const queryEmailsAgg = await db.collection('queries').aggregate([
                    { $group: { _id: '$userEmail' } }
                ]).toArray();

                // Step 2: Get unique emails from 'recommendations' collection
                const recommendationEmailsAgg = await db.collection('recommendations').aggregate([
                    { $group: { _id: '$recommenderEmail' } }
                ]).toArray();

                // Step 3: Combine and deduplicate emails
                const allEmails = [
                    ...queryEmailsAgg.map(item => item._id),
                    ...recommendationEmailsAgg.map(item => item._id),
                ];
                const uniqueEmails = new Set(allEmails);

                const average = queriesCount > 0
                    ? (recommendationsCount / queriesCount).toFixed(2)
                    : 0;

                res.json({
                    totalQueries: queriesCount,
                    totalRecommendations: recommendationsCount,
                    uniqueUsers: uniqueEmails.size,
                    averageRecommendations: average,
                });
            } catch (err) {
                console.error('[ERROR in /stats]', err);
                res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
            }
        });




        app.post('/reviews', async (req, res) => {
            try {
                // Extract with support for frontend keys
                const {
                    recommendationId,
                    rating,
                    reviewText,
                    reviewerName,
                    reviewerEmail,
                    reviewerPhoto
                } = req.body;

                // Validate required fields
                if (!recommendationId || !rating || !reviewText || !reviewerEmail) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                // Construct newReview using frontend's keys
                const newReview = {
                    recommendationId,
                    userEmail: reviewerEmail,
                    userName: reviewerName,
                    userPhoto: reviewerPhoto,
                    rating: parseInt(rating),
                    comment: reviewText,
                    createdAt: new Date()
                };

                // Insert review into the database
                const result = await reviewsCollection.insertOne(newReview);

                // Fetch recommendation details
                const recommendation = await recommendationsCollection.findOne({ _id: new ObjectId(recommendationId) });

                // Prepare email content to notify subscribers
                const subject = 'New Review Added to Recommendation';
                const message = `
            <div style="font-family: 'Arial', sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between;">
                <!-- Left Column: Recommendation details -->
                <div style="width: 45%; padding: 20px; background-color: #e0f7fa; border-radius: 8px;">
                    <h3 style="color: #007bff;">Recommendation</h3>
                    <p><strong>Recommendation Title:</strong> ${recommendation.title}</p>
                    <p><strong>Product Name:</strong> ${recommendation.productName}</p>
                    <p><strong>Recommendation Details:</strong> ${recommendation.details}</p>
                </div>

                <!-- Right Column: Review details -->
                <div style="width: 45%; padding: 20px; background-color: #ffeb3b; border-radius: 8px;">
                    <h3 style="color: #007bff;">New Review</h3>
                    <p><strong>Reviewed by:</strong> ${reviewerName}</p>
                    <p><strong>Rating:</strong> ${rating} Stars</p>
                    <p><strong>Review:</strong> ${reviewText}</p>
                </div>
            </div>
            <footer style="font-size: 14px; text-align: center; color: #888; margin-top: 20px;">
                <p>© 2025 Recommend Product</p>
            </footer>
        `;

                // Fetch all subscribers' emails
                const subscribers = await subscriptionsCollection.find().toArray();
                const subscriberEmails = subscribers.map(subscriber => subscriber.email);

                // Send email notification to all subscribers
                if (subscriberEmails.length > 0) {
                    for (let email of subscriberEmails) {
                        const mailOptions = {
                            from: `"Recommend Product" <${process.env.EMAIL_USER}>`, // Use your email or application name here
                            to: email,
                            subject: subject,
                            html: message, // HTML formatted email for the review notification
                        };

                        try {
                            await transporter.sendMail(mailOptions);
                            console.log(`Email sent to subscriber: ${email}`);
                        } catch (emailError) {
                            console.error(`Error sending email to ${email}:`, emailError);
                        }
                    }
                }

                // Send back the response with just the review details
                res.status(201).json({ insertedId: result.insertedId, review: { reviewerName, reviewText, rating } });

            } catch (err) {
                console.error('Review POST error:', err);
                res.status(500).json({ message: 'Server error' });
            }
        });


        // All Reviews Fetch API
        app.get('/reviews', async (req, res) => {
            try {
                const reviews = await reviewsCollection.find().sort({ createdAt: -1 }).toArray();
                res.status(200).json(reviews);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
                res.status(500).json({ message: "Server error" });
            }
        });


        // GET /reviews/by-recommendation/:id
        app.get('/reviews/by-recommendation/:id', async (req, res) => {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Recommendation ID required' });

            try {
                const reviews = await reviewsCollection
                    .find({ recommendationId: id })  // Filter by recommendationId
                    .sort({ createdAt: -1 })
                    .toArray();

                res.send(reviews);
            } catch (err) {
                res.status(500).json({ message: 'Failed to fetch recommendation reviews' });
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