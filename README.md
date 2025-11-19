# 🌤️ SkyCast Weather App

A modern, full-stack weather application with augmented reality features, intelligent outfit recommendations, and secure user authentication.

![SkyCast Logo](/frontend/public/Copilot_20251115_114124.png)

## 🚀 Features

### 🌦️ Weather Intelligence
- **Real-time Weather Data**: Accurate current conditions and forecasts
- **Location-based Forecasts**: Automatic location detection or manual city search
- **Weather History**: Track past weather patterns and preferences
- **Radar Integration**: Visual weather radar maps

### 🎯 Augmented Reality
- **AR Weather Visualization**: Experience weather conditions in augmented reality
- **Interactive 3D Elements**: Visualize temperature, precipitation, and wind patterns

### 👗 Smart Outfit Recommendations
- **AI-Powered Suggestions**: Get outfit recommendations based on weather conditions
- **Seasonal Advice**: Appropriate clothing suggestions for different weather scenarios
- **Personalized Preferences**: Learn from your style choices over time

### 🔐 Secure Authentication
- **User Registration & Login**: Secure account creation and management
- **Password Security**: Strong password requirements with visibility toggle
- **Session Management**: Persistent login with token-based authentication
- **Input Sanitization**: Protection against SQL injection and XSS attacks

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Beautiful Animations**: Smooth cloud animations and transitions
- **Intuitive Interface**: Clean, modern design with easy navigation
- **Loading States**: Elegant loading animations and user feedback

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **React Router** - Client-side routing
- **CSS3** - Custom animations and responsive design
- **Vite** - Fast build tool and development server

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Relational database
- **bcryptjs** - Password hashing
- **UUID** - Unique identifier generation

### Security
- **Input Validation** - Comprehensive client and server-side validation
- **SQL Injection Protection** - Parameterized queries and input sanitization
- **XSS Prevention** - Content security measures
- **Rate Limiting** - Protection against brute force attacks

## 📁 Project Structure





## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### 1. Clone the Repository
```bash


cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev


cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev

🎨 Features in Detail
Authentication Flow
Intro Screen: Checks authentication status and routes accordingly

New Users: Directed to registration

Returning Users: Directed to login

Authenticated Users: Directed to home dashboard

Token Management: Automatic token validation and expiration handling

Password Security
Minimum 8 characters with maximum 100 characters

Requires uppercase, lowercase, numbers, and special characters

No spaces allowed

Real-time strength indicator

Visibility toggle for better user experience

Responsive Design
Mobile-first approach

Adaptive layouts for all screen sizes

Touch-friendly interface elements

Optimized loading performance

🤝 Contributing
We welcome contributions! Please follow these steps:

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

👥 Authors
Daniel Kamau - ndech73

🙏 Acknowledgments
Weather data providers

Open-source libraries and tools

Contributors and testers



