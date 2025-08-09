# 🏐 Nova Volleyball Check-in System

A modern, full-stack web application for managing volleyball club check-ins, events, and athlete profiles.

## ✨ Features

### 🎯 Core Functionality
- **Athlete Check-in System**: Quick and easy check-in process for athletes
- **Event Management**: Create, edit, and manage volleyball events
- **Athlete Profiles**: Comprehensive athlete database with emergency contacts
- **Real-time Dashboard**: Live statistics and activity monitoring
- **Admin Panel**: User management and system administration

### 🚀 Technical Features
- **Real-time Updates**: Live dashboard with refresh functionality
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Performance Monitoring**: Built-in performance tracking
- **Responsive Design**: Mobile-friendly interface
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Glass morphism design with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router DOM** for navigation
- **React Hook Form** with Zod validation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **SQLite** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **Morgan** for request logging
- **Helmet** for security headers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nova-volleyball-checkin-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database and admin user**
   ```bash
   npx tsx server/scripts/add_admin.ts
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1: Start the backend server
   npm run server:dev
   
   # Terminal 2: Start the frontend development server
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Default admin credentials:
     - Username: `calebhobbs`
     - Password: `@zCardinals16`

## 📊 Testing

### Automated Tests
Run the comprehensive test suite:

```bash
# Basic functionality test
node test-app.js

# Comprehensive CRUD and performance test
node test-comprehensive.js
```

### Manual Testing
1. **Authentication**: Login with admin credentials
2. **Check-in Flow**: Visit `/checkin` to test public check-in
3. **Admin Panel**: Manage users and view statistics
4. **Event Management**: Create and manage events
5. **Athlete Management**: Add and edit athlete profiles

## 🏗️ Project Structure

```
nova-volleyball-checkin-main/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts
│   ├── lib/               # Utility functions and API
│   └── types/             # TypeScript type definitions
├── server/                # Backend source code
│   ├── routes/            # API route handlers
│   ├── scripts/           # Database scripts
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
└── public/                # Static assets
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (admin only)

### Athletes
- `GET /api/athletes` - Get all athletes
- `POST /api/athletes` - Create athlete
- `PUT /api/athletes/:id` - Update athlete
- `DELETE /api/athletes/:id` - Delete athlete
- `GET /api/athletes/search` - Search athletes

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/today` - Get today's events
- `GET /api/events/past` - Get past events
- `GET /api/events/disabled` - Get disabled events

### Check-ins
- `GET /api/checkins` - Get all check-ins
- `POST /api/checkins` - Create check-in
- `DELETE /api/checkins/:id` - Delete check-in
- `GET /api/checkins/today` - Get today's check-ins
- `GET /api/checkins/stats/overview` - Get check-in statistics

### Public Endpoints (No Auth Required)
- `GET /api/events/today` - Today's events for check-in
- `GET /api/events/past` - Past events
- `GET /api/events/disabled` - Disabled events

## 🎨 UI Components

### New Components Added
- **Notification**: Real-time alerts and messages
- **LoadingSpinner**: Reusable loading states
- **ErrorBoundary**: Graceful error handling
- **Enhanced Dashboard**: Real-time statistics and activity feed

### Design System
- **Color Palette**: Nova purple and cyan theme
- **Glass Morphism**: Modern translucent UI elements
- **Smooth Animations**: CSS transitions and hover effects
- **Responsive Layout**: Mobile-first design approach

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Protection**: Configured for production
- **Helmet Security**: Security headers middleware
- **Input Validation**: Zod schema validation
- **Error Boundaries**: Graceful error handling

## 📈 Performance Optimizations

- **React.memo**: Component memoization
- **useCallback**: Stable function references
- **Lazy Loading**: Code splitting for better performance
- **API Caching**: Efficient data fetching
- **Bundle Optimization**: Vite build optimization

## 🚀 Deployment

### Development
```bash
npm run dev          # Start frontend dev server
npm run server:dev   # Start backend dev server
```

### Production
```bash
npm run build        # Build frontend for production
npm run start        # Start production server
```

### Environment Variables
Create a `.env` file in the root directory:
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secret-key
```

## 🧪 Testing Strategy

### Automated Testing
- **API Testing**: Comprehensive endpoint testing
- **Performance Testing**: Concurrent request handling
- **CRUD Operations**: Full create, read, update, delete testing
- **Authentication**: Login and authorization testing

### Manual Testing Checklist
- [ ] User authentication and authorization
- [ ] Athlete check-in process
- [ ] Event creation and management
- [ ] Admin panel functionality
- [ ] Dashboard statistics
- [ ] Mobile responsiveness
- [ ] Error handling scenarios

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Reinitialize the database
   npx tsx server/scripts/add_admin.ts
   ```

2. **Port Already in Use**
   ```bash
   # Kill processes on ports 3001 and 5173
   lsof -ti:3001 | xargs kill -9
   lsof -ti:5173 | xargs kill -9
   ```

3. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode
Enable debug logging:
```bash
DEBUG=* npm run server:dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for Nova Volleyball Club**
