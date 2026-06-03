# FreshConnect Backend API

A Node.js backend API for a farm-to-consumer marketplace with WhatsApp notifications powered by CallMeBot API.

## 🚀 Features

- **User Authentication**: JWT-based authentication for farmers and customers
- **Product Management**: CRUD operations for farm products
- **Order Management**: Complete order lifecycle management
- **WhatsApp Notifications**: Free notifications using CallMeBot API
- **File Upload**: Image upload for products
- **Database**: MongoDB with Mongoose ODM

## 📱 WhatsApp Notifications (Removed)

The WhatsApp/Twilio integration has been removed from this repository. If you need to re-enable it later, consult `TWILIO_SETUP.md` for setup guidance and re-add the service files and routes.

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- WhatsApp account
- Phone number for testing

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Configuration

```bash
cp env-template.txt .env
```

Edit `.env` file with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/freshconnect

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Twilio WhatsApp API (FREE TRIAL!)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
TEST_PHONE=+your_phone_number_here
```

### 3. Twilio WhatsApp Setup (Professional API)

1. **Sign up for FREE Twilio account**: [https://www.twilio.com/](https://www.twilio.com/)
2. **Set up WhatsApp Sandbox** in Twilio Console
3. **Get your credentials** (Account SID, Auth Token, WhatsApp Number)
4. **Add to .env file**: 
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=+14155238886
   ```

For detailed setup instructions, see [TWILIO_SETUP.md](./TWILIO_SETUP.md)

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Test WhatsApp Integration

```bash
# Test CallMeBot API
npm run test:whatsapp
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (farmer only)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `POST /api/orders` - Create order (customer only)
- `GET /api/orders/customer` - Get customer orders
- `GET /api/orders/farmer` - Get farmer orders
- `PUT /api/orders/status` - Update order status (farmer only)
- `POST /api/orders/cancel` - Cancel order

> WhatsApp-related endpoints have been removed from this API.

## 🔧 Development

### Project Structure

```
backend/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic services
├── uploads/         # File uploads
├── server.js        # Main server file
└── test-callmebot.js # WhatsApp test script
```

### Key Services

- **WhatsApp Service**: Handles CallMeBot API integration
- **Order Controller**: Manages order lifecycle with notifications
- **Authentication**: JWT-based user authentication

## 🧪 Testing

### Test WhatsApp Notifications

```bash
# Run the test script
npm run test:whatsapp

# Or manually test an endpoint
curl http://localhost:4000/api/whatsapp/status
```

### Test Order Flow

1. Create a customer account
2. Create a farmer account
3. Add a product as farmer
4. Create an order as customer
5. Check WhatsApp for notifications!

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PORT` | Server port | No (default: 4000) |
| `CORS_ORIGIN` | Frontend URL | No (default: http://localhost:3000) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Yes |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number | Yes |
| `TEST_PHONE` | Phone number for testing | No |

## 🚨 Troubleshooting

### Common Issues

1. **WhatsApp not working**
   - Check Twilio credentials in `.env`
   - Verify WhatsApp sandbox setup
   - Test with `npm run test:whatsapp`

2. **Database connection**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env`

3. **Authentication errors**
   - Verify `JWT_SECRET` is set
   - Check token in request headers

## 🎯 Perfect for College Projects

This implementation is ideal for academic projects because:

- **Professional WhatsApp API**: Free trial with $15 credit
- **Complete CRUD operations**: Full order management
- **Real-time notifications**: WhatsApp integration
- **Modern tech stack**: Node.js, MongoDB, JWT
- **Easy to demo**: Visual notifications on phone

## 📚 Documentation

- [Twilio Setup Guide](./TWILIO_SETUP.md) - Detailed WhatsApp setup
- [API Documentation](./docs/) - Complete API reference
- [Environment Template](./env-template.txt) - Configuration template

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Coding! 🌱**
