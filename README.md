# AI Workout Generator

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue)](https://ai-workout-generator-40443.web.app)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange)](https://firebase.google.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A personalized AI-powered workout generator that creates custom fitness plans based on your specific requirements. Built with vanilla JavaScript, HTML, and CSS, and powered by Firebase for authentication and data storage.

## 🌟 Features

### 🤖 AI-Powered Workout Generation
- **Smart workout creation** using advanced AI models (Meta Llama 3-70B)
- **Personalized plans** based on your fitness level, goals, and preferences
- **Instant generation** with fallback options for reliability
- **Multiple workout types** including strength training, cardio, beginner routines, and home workouts

### 🔐 Secure Authentication
- **Email/password registration** with Firebase Authentication
- **Email verification** required for account activation
- **Secure login/logout** functionality
- **Password recovery** support
- **Protected routes** - workouts only accessible to verified users

### 💾 Workout Management
- **Save custom workouts** with personalized names
- **View all saved workouts** in an organized dashboard
- **Load previous workouts** for easy access
- **Delete unwanted workouts** with confirmation
- **Cloud storage** via Firebase Firestore

### 📱 User Experience
- **Responsive design** that works on all devices
- **Intuitive interface** with clean, modern styling
- **Real-time feedback** with loading states and notifications
- **Example prompts** to help users get started
- **Error handling** with user-friendly messages

## 🚀 Live Demo

Visit the live application: **[ai-workout-generator-40443.web.app](https://ai-workout-generator-40443.web.app)**

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with flexbox/grid
- **Vanilla JavaScript (ES6+)** - No frameworks, pure JavaScript
- **Firebase SDK** - Authentication and Firestore integration

### Backend & Infrastructure
- **Firebase Authentication** - User management and security
- **Firebase Firestore** - NoSQL database for workout storage
- **Firebase Functions** - Serverless backend for AI integration
- **Firebase Hosting** - Fast, secure web hosting
- **Together AI API** - Advanced language models for workout generation

### AI Models
- **Primary**: Meta Llama 3-70B Chat
- **Fallback**: Local workout generation algorithms
- **Backup Models**: Mixtral, Nous-Hermes, Llama 2 variants

## 📦 Project Structure

```
ai-workout-generator/
├── public/
│   ├── index.html              # Main dashboard
│   ├── auth/
│   │   ├── login.html          # Login page
│   │   └── signup.html         # Registration page
│   ├── css/
│   │   └── styles.css          # Application styles
│   └── js/
│       ├── main.js             # Main application logic
│       ├── auth.js             # Authentication functions
│       ├── workout.js          # Workout generation & management
│       └── firebase-config.js  # Firebase configuration
├── functions/
│   ├── index.js                # Cloud Functions
│   └── package.json            # Dependencies
└── README.md
```

## 🎯 How It Works

### 1. User Registration & Verification
```javascript
// Users register with email/password
await registerUser(email, password);
// Email verification required before access
await sendEmailVerification(user);
```

### 2. AI Workout Generation
```javascript
// Generate personalized workout based on user input
const workout = await generateWorkout(userPrompt);
// AI analyzes requirements and creates detailed plan
```

### 3. Workout Storage & Management
```javascript
// Save workouts to user's personal collection
await saveWorkout(workoutName, workoutContent);
// Load all user's saved workouts
const workouts = await loadSavedWorkouts();
```

## 🔧 Setup & Installation

### Prerequisites
- Firebase account
- Together AI API key (optional, has fallback)
- Node.js (for Firebase Functions)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-workout-generator
   ```

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**
   ```bash
   firebase login
   ```

4. **Initialize Firebase project**
   ```bash
   firebase init
   ```

5. **Configure Firebase**
   - Update `firebase-config.js` with your project credentials
   - Enable Authentication and Firestore in Firebase Console

6. **Set API Key (Optional)**
   ```bash
   firebase functions:config:set together.api_key="your-api-key"
   ```

7. **Deploy Functions**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

8. **Deploy Hosting**
   ```bash
   firebase deploy --only hosting
   ```

## 🎮 Usage Examples

### Basic Workout Request
```
"I'm a beginner looking for a 30-minute full body workout at home"
```

### Specific Goal-Oriented Request
```
"Create a high-intensity cardio workout for weight loss, 20 minutes, no equipment needed"
```

### Advanced Customization
```
"I need a strength training routine focusing on upper body, 3 days a week, intermediate level"
```

## 🔒 Security Features

- **Email verification** prevents spam accounts
- **Firebase Rules** protect user data
- **Authentication required** for all workout operations
- **CORS protection** on cloud functions
- **Input validation** prevents malicious requests

## 🎨 UI/UX Features

### Design Elements
- **Clean, modern interface** with intuitive navigation
- **Responsive layout** adapts to all screen sizes
- **Loading animations** provide user feedback
- **Success/error notifications** guide user actions
- **Sidebar navigation** for easy section switching

### Interactive Components
- **Example prompt chips** help users get started
- **Real-time form validation** prevents errors
- **Confirmation dialogs** prevent accidental deletions
- **Smooth transitions** enhance user experience

## 📊 Performance Optimizations

- **Lazy loading** of workout content
- **Efficient Firebase queries** with proper indexing
- **Caching strategies** for repeated requests
- **Fallback systems** ensure reliability
- **Error boundaries** handle unexpected issues

## 🚀 Deployment

The application is deployed on Firebase Hosting with automatic SSL and global CDN:

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Together AI** for providing advanced language models
- **Firebase** for comprehensive backend services
- **Meta** for the Llama language models
- **Open source community** for inspiration and tools

## 📞 Support

For support, email [your-email] or create an issue in the repository.

---

**Built with ❤️ using vanilla JavaScript, HTML, CSS, and Firebase**