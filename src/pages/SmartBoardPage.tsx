import React, { useState, useEffect } from 'react';
import UnifiedNavbar from '../components/UnifiedNavbar';
import SmartBoard from '../components/board/SmartBoard';
import { KanbanSquare, Home } from 'lucide-react';

const SmartBoardPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-kanban">
      {/* Header Navigation - Glass Style */}
      {/* Unified Navigation Header */}
      <UnifiedNavbar>
         <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-500 rounded-lg text-sm font-medium mr-2">
            <KanbanSquare className="w-4 h-4" />
            Smart Board
         </div>
      </UnifiedNavbar>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 min-h-0 flex flex-col">
        {/* Board Title */}
        <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">Smart Board</h2>
            <p className="text-slate-500 text-sm mt-1">Manage packing jobs efficiently.</p>
        </div>

        {/* Board Content */}
        <div className="flex-1 min-h-0">
             <SmartBoard />
        </div>
      </main>
    </div>
  );
};

export default SmartBoardPage;

