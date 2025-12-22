'use client';

import { useState, useEffect, useRef } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface TeamMembersPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamMembersPopover({ isOpen, onClose }: TeamMembersPopoverProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock team members data
    const mockMembers: TeamMember[] = [
      { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', avatar: 'A' },
      { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Manager', avatar: 'B' },
      { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', avatar: 'C' },
      { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Manager', avatar: 'D' },
      { id: '5', name: 'Eve Wilson', email: 'eve@example.com', role: 'User', avatar: 'E' },
    ];
    setTeamMembers(mockMembers);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Team Members</h3>
          <span className="text-xs text-gray-500">{teamMembers.length} members</span>
        </div>
      </div>

      {/* Team Members List */}
      <div className="max-h-96 overflow-y-auto">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-orange-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                  {member.role}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
          View all team members
        </button>
      </div>
    </div>
  );
}

