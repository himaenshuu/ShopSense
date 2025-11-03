import React from 'react';
import { ArrowRight, User, MessageSquare, LogOut, UserPlus } from 'lucide-react';

export function UIFlowDiagram() {
  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-[#202123] mb-8 text-center">Application Flow Diagram</h2>
      
      <div className="space-y-8">
        {/* Start Node */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-[#10A37F] to-[#0D8C6C] text-white px-6 py-3 rounded-xl shadow-md">
            <p>Start / Landing Page</p>
          </div>
        </div>

        {/* First Level - Authentication Options */}
        <div className="flex items-center justify-center gap-6">
          <ArrowRight className="text-gray-400 rotate-90" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sign In Path */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-[#10A37F] px-6 py-4 rounded-lg text-center shadow-sm">
              <User className="w-6 h-6 mx-auto mb-2 text-[#10A37F]" />
              <p className="text-[#202123]">Sign In</p>
              <p className="text-sm text-[#6e6e80] mt-1">Email / Google OAuth</p>
            </div>
            <div className="flex justify-center">
              <ArrowRight className="text-gray-400 rotate-90" />
            </div>
            <div className="bg-[#F7F7F8] border border-gray-200 px-6 py-4 rounded-lg text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-[#10A37F]" />
              <p className="text-[#202123]">Chat Interface</p>
              <p className="text-sm text-[#6e6e80] mt-1">With saved history</p>
            </div>
          </div>

          {/* Sign Up Path */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-[#10A37F] px-6 py-4 rounded-lg text-center shadow-sm">
              <UserPlus className="w-6 h-6 mx-auto mb-2 text-[#10A37F]" />
              <p className="text-[#202123]">Sign Up</p>
              <p className="text-sm text-[#6e6e80] mt-1">Create new account</p>
            </div>
            <div className="flex justify-center">
              <ArrowRight className="text-gray-400 rotate-90" />
            </div>
            <div className="bg-[#F7F7F8] border border-gray-200 px-6 py-4 rounded-lg text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-[#10A37F]" />
              <p className="text-[#202123]">Chat Interface</p>
              <p className="text-sm text-[#6e6e80] mt-1">With saved history</p>
            </div>
          </div>

          {/* Guest Path */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-amber-500 px-6 py-4 rounded-lg text-center shadow-sm">
              <User className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <p className="text-[#202123]">Guest Mode</p>
              <p className="text-sm text-[#6e6e80] mt-1">No sign-in required</p>
            </div>
            <div className="flex justify-center">
              <ArrowRight className="text-gray-400 rotate-90" />
            </div>
            <div className="bg-amber-50 border border-amber-300 px-6 py-4 rounded-lg text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <p className="text-[#202123]">Chat Interface</p>
              <p className="text-sm text-amber-700 mt-1">History not saved</p>
            </div>
          </div>
        </div>

        {/* Sign Out Flow */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <div className="bg-[#F7F7F8] border border-gray-200 px-6 py-3 rounded-lg">
              <p className="text-[#202123]">Any Chat Interface</p>
            </div>
            <ArrowRight className="text-gray-400" />
            <div className="bg-white border-2 border-red-500 px-6 py-3 rounded-lg">
              <LogOut className="w-5 h-5 inline-block mr-2 text-red-500" />
              <span className="text-[#202123]">Sign Out</span>
            </div>
            <ArrowRight className="text-gray-400" />
            <div className="bg-gradient-to-br from-[#10A37F] to-[#0D8C6C] text-white px-6 py-3 rounded-xl shadow-md">
              <p>Return to Landing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
