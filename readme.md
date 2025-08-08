<h1>🏠 Roommate Finder Server | রুমমেট ফাইন্ডার সার্ভার</h1>

<p>A robust backend API built with Node.js and Express.js to support the Roommate Finder application.<br>
This server handles user authentication, roommate listings management, likes, contact info reveals, and dashboard statistics.<br>
MongoDB is used as the database, and Firebase is integrated for secure authentication.</p>

<p>একটি শক্তিশালী ব্যাকএন্ড API যা রুমমেট ফাইন্ডার অ্যাপের জন্য ব্যবহৃত হয়।<br>
ইউজার অথেনটিকেশন, রুমমেট লিস্টিং, লাইক, কন্টাক্ট রিভিল এবং ড্যাশবোর্ড স্ট্যাটিসটিক্স পরিচালনা করে।<br>
ডেটাবেজ হিসেবে MongoDB এবং অথেনটিকেশনের জন্য Firebase ব্যবহার করা হয়েছে।</p>

<hr>

<h2>🚀 Key Features | প্রধান ফিচারসমূহ</h2>

<ul>
  <li>🔐 <strong>Firebase Authentication Integration</strong></li>
  <li>📝 <strong>Roommate Post CRUD</strong> (Create, Read, Update, Delete)</li>
  <li>💖 <strong>Like system</strong> (Like/Unlike roommate posts)</li>
  <li>📞 <strong>Contact info reveal</strong> after liking a post</li>
  <li>📊 <strong>Dashboard statistics</strong>: total listings, total likes, unique users, and reviews count</li>
  <li>🔒 <strong>Protected API routes</strong> accessible only by authenticated users</li>
  <li>⚙️ <strong>Efficient and scalable API design</strong> with Express.js</li>
  <li>📂 <strong>MongoDB integration</strong> using Mongoose ODM for data modeling</li>
</ul>

<hr>

<h2>🛠️ Technologies Used</h2>

<table>
  <tr><th>Technology</th><th>Description</th></tr>
  <tr><td>Node.js</td><td>JavaScript runtime environment</td></tr>
  <tr><td>Express.js</td><td>Backend web framework</td></tr>
  <tr><td>MongoDB</td><td>NoSQL database</td></tr>
  <tr><td>Mongoose</td><td>MongoDB ODM</td></tr>
  <tr><td>Firebase Admin SDK</td><td>User authentication and security</td></tr>
  <tr><td>JSON Web Token (JWT)</td><td>Token based user session handling</td></tr>
  <tr><td>Nodemailer</td><td>Email notification service</td></tr>
  <tr><td>dotenv</td><td>Environment variable management</td></tr>
</table>

<hr>

<h2>📦 Installation & Setup</h2>

<h3>Prerequisites</h3>

<ul>
  <li>Node.js installed (v14+ recommended)</li>
  <li>MongoDB instance (Atlas or local)</li>
  <li>Firebase project with service account credentials</li>
</ul>

<h3>Setup Steps</h3>

<ol>
  <li>Clone the repository  
    <pre>git clone https://github.com/JahidGittu/Roommate-Finder-Server.git<br>cd Roommate-Finder-Server</pre>
  </li>
  <li>Install dependencies  
    <pre>npm install</pre>
  </li>
  <li>Create <code>.env</code> file in root directory with following variables:  
    <pre>PORT=5000
MONGODB_URI=&lt;your_mongodb_connection_string&gt;
FIREBASE_SERVICE_ACCOUNT=&lt;base64_encoded_firebase_service_account_json&gt;
JWT_SECRET=&lt;your_jwt_secret&gt;
EMAIL_USER=&lt;your_email_for_notifications&gt;
EMAIL_PASS=&lt;your_email_password_or_app_password&gt;</pre>
  </li>
  <li>Run the server  
    <pre>npm start</pre>
  </li>
</ol>

<hr>

<h2>📡 API Endpoints Overview</h2>

<table>
  <thead>
    <tr><th>Route</th><th>Method</th><th>Description</th><th>Auth Required</th></tr>
  </thead>
  <tbody>
    <tr><td>/api/auth/register</td><td>POST</td><td>Register a new user</td><td>No</td></tr>
    <tr><td>/api/auth/login</td><td>POST</td><td>User login and JWT token generation</td><td>No</td></tr>
    <tr><td>/api/roommates</td><td>GET</td><td>Get all roommate posts</td><td>No</td></tr>
    <tr><td>/api/roommates</td><td>POST</td><td>Create a new roommate post</td><td>Yes</td></tr>
    <tr><td>/api/roommates/:id</td><td>GET</td><td>Get roommate post details by ID</td><td>No</td></tr>
    <tr><td>/api/roommates/:id</td><td>PUT</td><td>Update roommate post by ID</td><td>Yes</td></tr>
    <tr><td>/api/roommates/:id</td><td>DELETE</td><td>Delete roommate post by ID</td><td>Yes</td></tr>
    <tr><td>/api/roommates/:id/like</td><td>POST</td><td>Like or Unlike a roommate post</td><td>Yes</td></tr>
    <tr><td>/api/users/:id</td><td>GET</td><td>Get user profile info</td><td>Yes</td></tr>
    <tr><td>/api/dashboard/stats</td><td>GET</td><td>Get dashboard statistics</td><td>Yes</td></tr>
  </tbody>
</table>

<hr>

<h2>🧪 Running Locally</h2>

<pre>npm install
npm run start
</pre>

<p>or if you have nodemon installed for hot reload:</p>

<pre>npm run dev</pre>

<hr>

<h2>👨‍💻 Developer Info | ডেভেলপার তথ্য</h2>

<p>Developed by: Jahid Hossen<br>
GitHub: <a href="https://github.com/JahidGittu" target="_blank">https://github.com/JahidGittu</a><br>
Portfolio: <a href="http://jahid-portfolio.surge.sh/" target="_blank">http://jahid-portfolio.surge.sh/</a><br>
Email: jahid.hossen.me@gmail.com<br>
Location: Lakshmipur, Bangladesh</p>

<hr>

<h2>📜 License</h2>
<p>This project is licensed under the MIT License.</p>
