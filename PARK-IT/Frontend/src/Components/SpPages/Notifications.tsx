import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Car, DollarSign, Calendar, X } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reservation_details?: {
    id: number;
    spot_number: string;
    driver: string;
  };
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/notifications/', {
        withCredentials: true,
      });
      
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.post(
        `http://localhost:8000/api/notifications/${id}/mark_read/`,
        {},
        { withCredentials: true }
      );
      
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(
        'http://localhost:8000/api/notifications/mark_all_read/',
        {},
        { withCredentials: true }
      );
      
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell size={32} />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <CheckCheck size={18} />
                Mark All Read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Bell className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? 'All caught up! No unread notifications.' 
                : 'You have no notifications yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkRead }) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'reservation':
        return <Car className="text-blue-600" size={24} />;
      case 'arrival':
        return <Check className="text-green-600" size={24} />;
      case 'departure':
        return <DollarSign className="text-purple-600" size={24} />;
      case 'cancellation':
        return <X className="text-red-600" size={24} />;
      default:
        return <Bell className="text-gray-600" size={24} />;
    }
  };

  const getColor = () => {
    switch (notification.notification_type) {
      case 'reservation':
        return 'border-blue-200 bg-blue-50';
      case 'arrival':
        return 'border-green-200 bg-green-50';
      case 'departure':
        return 'border-purple-200 bg-purple-50';
      case 'cancellation':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-l-4 overflow-hidden transition-all ${
        notification.is_read ? 'opacity-60' : ''
      } ${getColor()}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-white">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {notification.title}
                </h3>
                <p className="text-gray-700 text-sm mb-2">
                  {notification.message}
                </p>
                
                {notification.reservation_details && (
                  <div className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full inline-block">
                    Spot {notification.reservation_details.spot_number} • {notification.reservation_details.driver}
                  </div>
                )}
              </div>
              
              {!notification.is_read && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                  title="Mark as read"
                >
                  <Check size={20} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <Calendar size={14} />
              <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
