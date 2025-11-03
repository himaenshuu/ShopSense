import React from 'react';
import { 
  Code2, 
  Palette, 
  Database, 
  Lock, 
  Cloud, 
  Layers,
  FileCode,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function TechStackDocumentation() {
  const techStack = [
    {
      category: 'Frontend Framework',
      icon: <Code2 className="w-6 h-6 text-[#10A37F]" />,
      technology: 'Next.js (React)',
      description: 'Modern React framework with server-side rendering, file-based routing, and optimal performance',
      details: [
        'React 18+ for component-based UI',
        'TypeScript for type safety',
        'App Router for efficient routing',
        'Fast refresh for instant updates'
      ]
    },
    {
      category: 'Styling & Design',
      icon: <Palette className="w-6 h-6 text-[#10A37F]" />,
      technology: 'Tailwind CSS v4',
      description: 'Utility-first CSS framework for rapid UI development with custom design system',
      details: [
        'Custom color palette (#10A37F, #202123, #F7F7F8)',
        'Inter font family for clean typography',
        'Responsive design utilities',
        'Custom component variants'
      ]
    },
    {
      category: 'Backend & API',
      icon: <Layers className="w-6 h-6 text-[#10A37F]" />,
      technology: 'Node.js + Express.js',
      description: 'Fast, unopinionated web framework for building RESTful APIs',
      details: [
        'RESTful API endpoints',
        'Middleware for authentication',
        'Error handling & validation',
        'CORS configuration'
      ]
    },
    {
      category: 'Database',
      icon: <Database className="w-6 h-6 text-[#10A37F]" />,
      technology: 'Appwrite / MongoDB',
      description: 'Backend-as-a-Service or NoSQL database for flexible data storage',
      details: [
        'User accounts and profiles',
        'Chat conversations storage',
        'Message history persistence',
        'Real-time data synchronization'
      ]
    },
    {
      category: 'Authentication',
      icon: <Lock className="w-6 h-6 text-[#10A37F]" />,
      technology: 'Appwrite Auth / NextAuth.js',
      description: 'Secure authentication with multiple providers and session management',
      details: [
        'Email/password authentication',
        'OAuth providers (Google, GitHub)',
        'JWT token management',
        'Guest mode support'
      ]
    },
    {
      category: 'Hosting & Deployment',
      icon: <Cloud className="w-6 h-6 text-[#10A37F]" />,
      technology: 'Vercel + MongoDB Atlas',
      description: 'Cloud platforms for seamless deployment and scalability',
      details: [
        'Frontend on Vercel for edge performance',
        'Database on MongoDB Atlas',
        'Automatic deployments from Git',
        'SSL certificates included'
      ]
    },
    {
      category: 'UI Components',
      icon: <FileCode className="w-6 h-6 text-[#10A37F]" />,
      technology: 'shadcn/ui',
      description: 'Beautifully designed, accessible component library built with Radix UI',
      details: [
        'Pre-built accessible components',
        'Customizable with Tailwind',
        'Dialog, Alert, Input components',
        'Fully typed TypeScript support'
      ]
    },
    {
      category: 'State Management',
      icon: <Package className="w-6 h-6 text-[#10A37F]" />,
      technology: 'React Context API',
      description: 'Built-in React state management for authentication and app state',
      details: [
        'AuthContext for user state',
        'Local storage for guest mode',
        'useContext hooks for consumption',
        'Minimal overhead, native React'
      ]
    }
  ];

  const designSystem = {
    colors: [
      { name: 'Primary Green', hex: '#10A37F', usage: 'Buttons, links, accents' },
      { name: 'Dark Text', hex: '#202123', usage: 'Primary text content' },
      { name: 'Light Background', hex: '#F7F7F8', usage: 'Page background, subtle areas' },
      { name: 'Muted Text', hex: '#6E6E80', usage: 'Secondary text, placeholders' },
      { name: 'White', hex: '#FFFFFF', usage: 'Cards, input fields, chat bubbles' }
    ],
    typography: {
      family: 'Inter',
      weights: [300, 400, 500, 600, 700],
      usage: 'All text throughout the application'
    },
    spacing: {
      radius: '8px - 12px',
      padding: '12px - 24px',
      gaps: '12px - 16px'
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-[#202123] mb-4">Technical Documentation</h1>
        <p className="text-[#6e6e80] max-w-3xl mx-auto">
          Complete technical stack and implementation guide for the ChatGPT-style conversational UI
        </p>
      </div>

      {/* Tech Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {techStack.map((item, index) => (
          <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                {item.icon}
                <CardTitle className="text-[#202123]">{item.category}</CardTitle>
              </div>
              <p className="text-[#10A37F]">{item.technology}</p>
            </CardHeader>
            <CardContent>
              <p className="text-[#6e6e80] mb-4">{item.description}</p>
              <ul className="space-y-2">
                {item.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[#202123]">
                    <span className="text-[#10A37F] mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Design System */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#202123]">Design System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Palette */}
          <div>
            <h3 className="text-[#202123] mb-4">Color Palette</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {designSystem.colors.map((color, idx) => (
                <div key={idx} className="space-y-2">
                  <div 
                    className="h-20 rounded-lg shadow-sm border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-sm text-[#202123]">{color.name}</p>
                  <p className="text-xs text-[#6e6e80] font-mono">{color.hex}</p>
                  <p className="text-xs text-[#6e6e80]">{color.usage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-[#202123] mb-3">Typography</h3>
              <p className="text-[#6e6e80] mb-2">Font Family: {designSystem.typography.family}</p>
              <p className="text-[#6e6e80] mb-2">
                Weights: {designSystem.typography.weights.join(', ')}
              </p>
              <p className="text-sm text-[#6e6e80]">{designSystem.typography.usage}</p>
            </div>

            <div>
              <h3 className="text-[#202123] mb-3">Spacing & Layout</h3>
              <p className="text-[#6e6e80] mb-2">Border Radius: {designSystem.spacing.radius}</p>
              <p className="text-[#6e6e80] mb-2">Padding: {designSystem.spacing.padding}</p>
              <p className="text-[#6e6e80]">Gaps: {designSystem.spacing.gaps}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-[#F7F7F8] to-white">
        <CardHeader>
          <CardTitle className="text-[#202123]">Implementation Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-[#202123] mb-2">Setup Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-[#6e6e80]">
              <li>Clone the repository and install dependencies: <code className="bg-white px-2 py-1 rounded text-sm">npm install</code></li>
              <li>Set up Appwrite project or MongoDB database</li>
              <li>Configure environment variables (.env.local)</li>
              <li>Run development server: <code className="bg-white px-2 py-1 rounded text-sm">npm run dev</code></li>
              <li>Deploy to Vercel for production</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-[#202123] mb-2">Key Features</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[#6e6e80]">
              <li className="flex items-start gap-2">
                <span className="text-[#10A37F]">✓</span>
                <span>Email/password authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#10A37F]">✓</span>
                <span>Google OAuth integration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#10A37F]">✓</span>
                <span>Guest mode with localStorage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#10A37F]">✓</span>
                <span>Chat history persistence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#10A37F]">✓</span>
                <span>Responsive mobile design</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#10A37F]">✓</span>
                <span>Real-time message updates</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
