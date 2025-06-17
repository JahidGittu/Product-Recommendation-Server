# Product Recommendation API

Welcome to the **Product Recommendation API**! This is a powerful API built with **Node.js** and **Express.js** that allows users to submit product queries, recommendations, reviews, and subscribe for notifications about new recommendations and queries. The API is connected to **MongoDB** for persistent data storage and **Firebase** for secure user authentication. **Nodemailer** is used for sending email notifications to users about various updates.

## Features
- **Subscription Management**: Users can subscribe to receive updates about product recommendations.
- **Query Submission**: Users can submit product queries along with boycott reasons.
- **Recommendations**: Users can submit, like/unlike, and comment on product recommendations.
- **Review System**: Users can leave reviews and ratings on product recommendations.
- **User Authentication**: Firebase authentication is used to verify users before allowing access to specific routes.
- **Email Notifications**: Subscribers are notified via email when there are new queries, recommendations, and comments.
- **Statistics**: The API provides various statistics such as total queries, recommendations, and unique users.

## Table of Contents
- [Installation](#installation)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Subscription API](#subscription-api)
  - [Queries API](#queries-api)
  - [Recommendations API](#recommendations-api)
  - [Reviews API](#reviews-api)
  - [Users API](#users-api)
- [Starting the Server](#starting-the-server)
- [Testing the API](#testing-the-api)
- [License](#license)

## Installation

### Prerequisites
Ensure you have the following installed:
- **Node.js**: [Download and install Node.js](https://nodejs.org/)
- **MongoDB**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for cloud database or a local MongoDB instance.
- **Firebase**: Set up Firebase and create a Firebase project for authentication.

### Steps to install
1. Clone the repository or download the code.
    ```bash
    git clone <repository-url>
    ```

2. Navigate to the project folder.
    ```bash
    cd <project-folder>
    ```

3. Install the required dependencies.
    ```bash
    npm install
    ```

## Setup

1. Create a `.env` file in the root directory of your project to configure environment variables.
   
   Example `.env` file:
   ```env
   DB_USER=<Your MongoDB username>
   DB_PASS=<Your MongoDB password>
   EMAIL_USER=<Your email address (Gmail)>
   EMAIL_PASS=<Your email password (App Password)>
   FB_SERVICE_KEY=<Your Firebase service account JSON key, base64 encoded>
