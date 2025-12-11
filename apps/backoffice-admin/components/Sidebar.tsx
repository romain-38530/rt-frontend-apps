import { Home, Building2, DollarSign, Package, Activity, Settings, Menu, X, Target } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { LogoCompact } from '../../../src/components/Logo';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Organisations', href: '/orgs' },
  { icon: Target, label: 'CRM Leads', href: '/crm' },
  { icon: DollarSign, label: 'Tarifs', href: '/pricing' },
  { icon: Package, label: 'Palettes', href: '/palettes' },
  { icon: Activity, label: 'Etat des services', href: '/health' },
  { icon: Settings, label: 'Parametres', href: '/settings' },
];

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    setCollapsed(!collapsed);
    onToggle?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={handleToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        sidebar
        ${collapsed ? 'w-20' : 'w-[280px]'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        transition-all duration-300
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed ? (
              <a href="/" className="flex items-center">
                <LogoCompact width={180} height={54} />
              </a>
            ) : (
              <a href="/" className="flex items-center justify-center w-full">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  S
                </div>
              </a>
            )}
            <button
              onClick={handleToggle}
              className="lg:block hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {collapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {!collapsed && isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@rt-tech.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
