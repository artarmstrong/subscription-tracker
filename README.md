# 📱 Subscription Tracker API

A robust Node.js REST API for managing personal subscriptions with comprehensive tracking, validation, and user management features.

## 🎯 Project Overview

The Subscription Tracker API helps users manage their digital subscriptions by providing a secure, well-tested backend service. Built with modern Node.js technologies, it offers comprehensive subscription management with user authentication, data validation, and business rule enforcement.

### ✨ **Key Features**

- **🔐 User Authentication**: Secure JWT-based authentication system
- **📋 Subscription Management**: Full CRUD operations for subscription tracking
- **💰 Financial Tracking**: Support for multiple currencies (USD, EUR, GBP)
- **📅 Smart Scheduling**: Automatic renewal date management and status tracking
- **🛡️ Data Validation**: Comprehensive input validation and business rules
- **⚡ Rate Limiting**: Built-in API protection and abuse prevention
- **🧪 Well Tested**: 57 comprehensive unit tests ensuring reliability

### 🏗️ **Tech Stack**

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **Testing**: Jest with MongoDB Memory Server
- **Environment**: dotenv for configuration management

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### **Installation**

```bash
# Clone the repository
git clone https://github.com/artarmstrong/subscription-tracker.git
cd subscription-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.development.local.example .env.development.local
# Edit .env.development.local with your configuration

# Start the development server
npm run dev
```

### **Environment Variables**

Create `.env.development.local` with:
```env
PORT=3000
NODE_ENV=development
DB_URI=mongodb://localhost:27017/subscription-tracker
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

## 📡 API Endpoints

### **Authentication**
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/signin` - User login
- `POST /api/v1/auth/signout` - User logout

### **Users**
- `GET /api/v1/users` - Get all users (authenticated)
- `GET /api/v1/users/:id` - Get user by ID (authenticated)

### **Subscriptions**
- `POST /api/v1/subscriptions` - Create new subscription (authenticated)
- `GET /api/v1/subscriptions/user/:id` - Get user's subscriptions (authenticated)

## 🧪 Testing

This project has a **comprehensive testing suite** with excellent coverage of all critical functionality.

### **Test Overview**
```
✅ Test Suites: 4 passed, 4 total
✅ Tests: 57 passed, 57 total
✅ Coverage: Excellent coverage of critical components
✅ Runtime: ~4 seconds
```

### **What's Tested**
- **User Model** (15 tests): Registration, validation, authentication
- **Subscription Model** (22 tests): CRUD operations, business rules, validation
- **Auth Middleware** (9 tests): JWT validation, security, error handling
- **Error Middleware** (9 tests): Error transformation, status codes

### **Running Tests**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### **Test Infrastructure**
- **Jest**: Modern testing framework with ES modules support
- **MongoDB Memory Server**: In-memory database for fast, isolated tests
- **Comprehensive Mocking**: JWT tokens, user authentication, error scenarios
- **Data Factories**: Realistic test data generation

For detailed testing documentation, see [TESTING_GUIDE.md](./TESTING_GUIDE.md).

## 📊 Project Structure

```
subscription-tracker/
├── app.js                      # Main application entry point
├── config/
│   └── env.js                  # Environment configuration
├── controllers/
│   ├── auth.controller.js      # Authentication logic
│   ├── subscription.controller.js # Subscription management
│   └── user.controller.js      # User management
├── database/
│   └── mongodb.js              # Database connection
├── middlewares/
│   ├── auth.middleware.js      # JWT authentication
│   ├── error.middleware.js     # Error handling
│   └── rateLimit.middleware.js # Rate limiting
├── models/
│   ├── user.model.js           # User data model
│   └── subscription.model.js   # Subscription data model
├── routes/
│   ├── auth.routes.js          # Authentication routes
│   ├── subscription.routes.js  # Subscription routes
│   └── user.routes.js          # User routes
└── tests/
    ├── unit/                   # Unit tests
    ├── helpers.js              # Test utilities
    ├── setup.js                # Test configuration
    └── testDb.js               # Test database setup
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API abuse prevention
- **Error Handling**: Secure error responses without information leakage

## 📈 Data Models

### **User Model**
- Name, email, password
- Email uniqueness and format validation
- Password strength requirements
- Automatic timestamp tracking

### **Subscription Model**
- Name, price, currency, frequency
- Category classification (entertainment, technology, etc.)
- Payment method tracking
- Start and renewal date management
- Status tracking (active, cancelled, expired)
- User relationship with data isolation

## 🛠️ Development

### **Available Scripts**
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run test suite
npm run test:watch # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### **Code Quality**
- **ESLint**: Code linting and style enforcement
- **Jest**: Comprehensive testing with high coverage
- **Mongoose**: Schema validation and data modeling
- **Express**: RESTful API design patterns

## 📋 API Testing

A Postman collection is available in `postman_collection.json` for easy API testing and exploration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Enhancements

- [ ] Email notifications for upcoming renewals
- [ ] Subscription analytics and insights
- [ ] Multi-currency conversion support
- [ ] Mobile app integration
- [ ] Subscription sharing and family plans
- [ ] Integration with popular subscription services

---

**Built with ❤️ using Node.js and modern web technologies**