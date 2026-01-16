# 🛍️ ShopSense - AI-Powered E-Commerce Shopping Assistant

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.0.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-6.20.0-green?style=for-the-badge&logo=mongodb)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-orange?style=for-the-badge&logo=google)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**An intelligent conversational assistant that transforms online shopping with AI-powered product discovery, sentiment analysis, and personalized recommendations.**

[🐳 Docker Image](https://hub.docker.com/r/himaenshuu/shopassist) • [📖 Documentation](./docs) • [🚀 Live Demo](#)

</div>

---

## 🌟 What Makes ShopSense Stand Out

ShopSense isn't just another e-commerce chatbot. It's a sophisticated AI-powered shopping companion that combines:

- **🧠 Intelligent Intent Recognition** - Understands complex shopping queries and classifies intent (product search, price comparison, reviews, general chat)
- **💬 Context-Aware Conversations** - Maintains conversation history with persistent chat sessions stored in real-time
- **🎯 Semantic Product Search** - MongoDB text indexing for lightning-fast, relevant product discovery
- **📊 Advanced Sentiment Analysis** - Dual-mode sentiment processing using both Gemini AI and custom ML models for accurate review analysis
- **📧 Smart Email Generation** - AI-crafted product recommendation emails with personalized content
- **🔊 Text-to-Speech Integration** - Convert responses to natural speech for accessibility
- **🔐 Secure Authentication** - Appwrite-powered auth with OAuth support and guest mode
- **🎨 Beautiful UI/UX** - Modern, responsive design with dark mode and 40+ shadcn/ui components

---

## 🎯 Problem Statement

Online shoppers face three critical challenges:

1. **Information Overload** - Thousands of products, reviews, and specifications make decision-making exhausting
2. **Trust Deficit** - Difficulty assessing genuine product quality from mixed reviews
3. **Time Consumption** - Hours spent comparing prices, reading reviews, and researching alternatives

### ✨ Our Solution

ShopSense solves these problems by:

- **Conversational Product Discovery** - Ask questions naturally: "Find me wireless headphones under $100 with good battery life"
- **Instant Review Synthesis** - AI-powered sentiment analysis summarizes hundreds of reviews in seconds
- **Smart Comparisons** - Compare products side-by-side with pricing insights and feature breakdowns
- **Proactive Recommendations** - Email yourself curated product suggestions for later review

---

## 🚀 Key Features

### 🤖 AI-Powered Chat Interface

- Natural language product queries with intent classification
- Context-aware responses based on conversation history
- Real-time streaming responses for instant feedback
- Guest mode for quick access, authenticated mode for personalized experience

### 📈 Intelligent Sentiment Analysis

- Hybrid sentiment engine combining Gemini AI and custom ML models
- Review summarization with positive/negative/neutral categorization
- Highlighted examples from actual customer reviews
- Confidence scoring for reliability

### 🔍 Advanced Product Search

- MongoDB text search with relevance scoring
- Multi-field indexing (name, category, description)
- Price range filtering and sorting
- Availability status tracking

### 💌 Email Integration

- AI-generated personalized product recommendation emails
- SendGrid integration for reliable delivery
- Customizable templates with product details and links
- One-click email sending from chat interface

### 🎙️ Accessibility Features

- Text-to-speech conversion using Gemini TTS
- Screen reader compatible components
- Keyboard navigation support
- WCAG-compliant UI design

### 🎨 Modern User Experience

- Responsive design for all devices
- Dark/light theme toggle with system preference detection
- Smooth animations and transitions
- Real-time typing indicators

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 15.0.3** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5.6.3** - Type-safe development
- **Tailwind CSS 3.4.17** - Utility-first styling
- **shadcn/ui** - 40+ beautiful, accessible components
- **Radix UI** - Unstyled, accessible component primitives

### Backend & APIs

- **Next.js API Routes** - Serverless functions
- **Google Gemini AI** - Chat completions, sentiment analysis, email generation, TTS
- **Appwrite 16.0.2** - Authentication, realtime database, storage
- **MongoDB 6.20.0** - Product database with text search indexing
- **SendGrid** - Transactional email delivery

### AI/ML

- **@google/generative-ai** - Google Gemini integration
- **@xenova/transformers 2.17.2** - Client-side ML models for sentiment analysis
- **Custom Intent Classifier** - Query categorization engine
- **Sentiment Analyzer** - Hybrid sentiment processing

### DevOps & Deployment

- **Docker** - Containerization for consistent deployments
- **Vercel** - Production hosting with automatic deployments
- **GitHub Actions** - CI/CD pipeline for testing and validation

---

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Pull the pre-built image
docker pull himaenshuu/shopassist:v1

# Run the container
docker run -p 3000:3000 --env-file .env himaenshuu/shopassist:v1

# Access at http://localhost:3000
```

**Docker Image:** [🐳 himaenshuu/shopassist:v1](https://hub.docker.com/r/himaenshuu/shopassist)

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier works)
- Appwrite account (cloud or self-hosted)
- Google Gemini API key
- SendGrid API key (for email features)

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub repository to Vercel**
2. **Add environment variables in Vercel dashboard**
3. **Deploy automatically on push to main**

---

## 🧪 CI/CD Pipeline

Automated testing and validation on every pull request:

- ✅ **ESLint** - Code quality and style checks
- ✅ **TypeScript** - Type validation
- ✅ **Build** - Compilation verification

Protected main branch ensures only validated code reaches production.

---

## 📊 Architecture Highlights

### Data Flow

```
User Query → Intent Classifier → Product Service → MongoDB
                                                        ↓
                                                 Gemini AI
                                                        ↓
                                            Response Generation
                                                        ↓
                                              User Interface
```

### Key Components

**Intent Classification**

- Analyzes user queries to determine intent
- Routes to appropriate service (product search, review analysis, chat)
- Confidence scoring for accurate classification

**Product Search Pipeline**

- MongoDB text indexing for fast full-text search
- Relevance scoring and ranking
- Price filtering and availability checks

**Sentiment Analysis Engine**

- Gemini AI for semantic understanding
- Fallback to custom ML model for reliability
- Structured output parsing with confidence metrics

**Email Generation**

- Context-aware content creation
- Product detail integration
- SendGrid delivery with tracking

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** - Powerful language models
- **Appwrite** - Backend-as-a-Service platform
- **MongoDB** - Scalable document database
- **Vercel** - Deployment and hosting
- **shadcn/ui** - Beautiful component library
- **Open Source Community** - Amazing tools and libraries

---

## 📧 Contact & Support

- **Issues:** [GitHub Issues](https://github.com/himaenshuu/shopsense/issues)
- **Discussions:** [GitHub Discussions](https://github.com/himaenshuu/shopsense/discussions)
- **Email:** himanshusingh26.2.2004@gmail.com

---

<div align="center">

**Built with ❤️ using Next.js and Google Gemini AI**

⭐ Star this repo if you find it helpful!

</div>
