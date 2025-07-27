# Employee Recognition Backend

A comprehensive Node.js/Express backend for an employee recognition and rewards system. This application provides a complete platform for managing employee achievements, recognitions, rewards, and analytics with Keycloak authentication integration.

## 🚀 Features

### Core Functionality
- **User Management**: Complete user profile management with role-based access control
- **Recognition System**: Peer-to-peer recognition with customizable categories and points
- **Achievement System**: Gamified achievements with progress tracking and notifications
- **Reward Management**: Comprehensive reward catalog with redemption tracking
- **Analytics Dashboard**: Detailed analytics and reporting for administrators
- **Notification System**: Real-time notifications for achievements and recognitions

### Technical Features
- **Authentication**: Keycloak integration for secure authentication and authorization
- **Role-Based Access**: Admin, Manager, and Employee role management
- **File Upload**: Profile picture and document upload capabilities
- **API Documentation**: Swagger/OpenAPI documentation
- **Testing**: Comprehensive test suite with Jest
- **Docker Support**: Containerized deployment with Docker Compose

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Keycloak
- **File Upload**: Multer
- **Testing**: Jest with MongoDB Memory Server
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Keycloak Server
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-recognition-backend
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Configure your environment variables**
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/employee-recognition
   
   # Keycloak Configuration
   KEYCLOAK_REALM=your-realm
   KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080/auth
   KEYCLOAK_CLIENT_ID=your-client-id
   SESSION_SECRET=your-session-secret
   
   # Server
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB and Keycloak**
   ```bash
   # Start MongoDB
   mongod
   
   # Start Keycloak (using Docker)
   docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

Once the application is running, you can access the API documentation at:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **API Base URL**: `http://localhost:3000/api`

### Main API Endpoints

#### Authentication & Users
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload profile picture

#### Recognition System
- `POST /api/recognitions` - Create recognition
- `GET /api/recognitions` - Get recognitions
- `GET /api/recognitions/:id` - Get specific recognition
- `PUT /api/recognitions/:id` - Update recognition
- `DELETE /api/recognitions/:id` - Delete recognition

#### Achievement System
- `GET /api/achievements` - Get all achievements
- `GET /api/achievements/:id` - Get specific achievement
- `POST /api/achievements/:id/progress` - Update achievement progress
- `GET /api/users/:id/achievements` - Get user achievements

#### Reward System
- `GET /api/rewards` - Get all rewards
- `POST /api/rewards` - Create reward (Admin only)
- `POST /api/rewards/:id/redeem` - Redeem reward
- `GET /api/rewards/redemptions` - Get redemption history

#### Analytics
- `GET /api/analytics/recognition-stats` - Recognition statistics
- `GET /api/analytics/user-activity` - User activity analytics
- `GET /api/analytics/reward-stats` - Reward statistics

#### Admin Routes
- `GET /api/admin/users` - Get all users (Admin only)
- `GET /api/admin/analytics` - Admin analytics dashboard
- `POST /api/admin/achievements` - Create achievement (Admin only)

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- achievementService.test.ts
```

### Test Coverage
The project includes comprehensive tests for:
- Service layer functionality
- Repository layer operations
- API endpoint testing
- Integration tests

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files (Keycloak, database)
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, validation)
├── models/          # Mongoose data models
├── repositories/    # Data access layer
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── test/            # Test files
└── app.ts           # Main application file
```

## 🔐 Authentication & Authorization

The application uses Keycloak for authentication and implements role-based access control:

### Roles
- **Admin**: Full system access, can manage users, achievements, and rewards
- **Manager**: Can view team analytics and manage team recognitions
- **Employee**: Can give/receive recognitions and redeem rewards

### Protected Routes
Most API endpoints require authentication. Admin routes require admin privileges.

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build custom image
docker build -t employee-recognition-backend .
docker run -p 3000:3000 employee-recognition-backend
```

## 📊 Database Schema

The application uses MongoDB with the following main collections:
- **Users**: User profiles and authentication data
- **Recognitions**: Peer-to-peer recognition records
- **Achievements**: Gamification achievements and progress
- **Rewards**: Reward catalog and redemption tracking
- **Organizations**: Multi-tenant organization support
- **Notifications**: User notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the test files for usage examples

## 🔄 Version History

- **v1.0.0**: Initial release with core recognition and reward functionality
- Complete user management system
- Achievement and gamification features
- Analytics and reporting capabilities
- Keycloak authentication integration 