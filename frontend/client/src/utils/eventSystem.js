// Real-time Event System for Cross-Module Communication
class EventSystem {
  constructor() {
    this.events = {};
    this.setupGlobalEventListeners();
  }

  // Setup global event listeners for real-time updates
  setupGlobalEventListeners() {
    // Listen for custom events from the backend
    window.addEventListener('inventoryUpdated', this.handleInventoryUpdate.bind(this));
    window.addEventListener('stockUpdated', this.handleStockUpdate.bind(this));
    window.addEventListener('productionUpdated', this.handleProductionUpdate.bind(this));
    window.addEventListener('salesUpdated', this.handleSalesUpdate.bind(this));
    window.addEventListener('purchaseUpdated', this.handlePurchaseUpdate.bind(this));
    window.addEventListener('notificationReceived', this.handleNotificationReceived.bind(this));
    window.addEventListener('warehouseUpdated', this.handleWarehouseUpdate.bind(this));
  }

  // Handle inventory updates
  handleInventoryUpdate(event) {
    console.log('Inventory updated:', event.detail);
    this.dispatch('inventory:updated', event.detail);
    this.dispatch('dashboard:refresh', { module: 'inventory' });
  }

  // Handle stock updates
  handleStockUpdate(event) {
    console.log('Stock updated:', event.detail);
    this.dispatch('stock:updated', event.detail);
    this.dispatch('dashboard:refresh', { module: 'stock' });
  }

  // Handle production updates
  handleProductionUpdate(event) {
    console.log('Production updated:', event.detail);
    this.dispatch('production:updated', event.detail);
    this.dispatch('dashboard:refresh', { module: 'production' });
  }

  // Handle sales updates
  handleSalesUpdate(event) {
    console.log('Sales updated:', event.detail);
    this.dispatch('sales:updated', event.detail);
    this.dispatch('dashboard:refresh', { module: 'sales' });
  }

  // Handle purchase updates
  handlePurchaseUpdate(event) {
    console.log('Purchase updated:', event.detail);
    this.dispatch('purchase:updated', event.detail);
    this.dispatch('dashboard:refresh', { module: 'purchase' });
  }

  // Handle notification received
  handleNotificationReceived(event) {
    console.log('Notification received:', event.detail);
    this.dispatch('notification:received', event.detail);
    this.showNotificationToast(event.detail);
  }

  // Handle warehouse updates
  handleWarehouseUpdate(event) {
    console.log('Warehouse updated:', event.detail);
    this.dispatch('warehouse:updated', event.detail);
    this.dispatch('dashboard:refresh', { module: 'warehouse' });
  }

  // Show notification toast
  showNotificationToast(notification) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
      notification.priority === 'critical' ? 'bg-red-500' :
      notification.priority === 'high' ? 'bg-orange-500' :
      notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
    } text-white`;
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="flex-1">
          <h4 class="font-semibold">${notification.title}</h4>
          <p class="text-sm">${notification.message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  // Dispatch custom event
  dispatch(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
  }

  // Listen for events
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    
    // Also listen to the actual DOM event
    window.addEventListener(eventName, callback);
  }

  // Remove event listener
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
    window.removeEventListener(eventName, callback);
  }

  // Trigger real-time updates for specific modules
  triggerInventoryUpdate(data) {
    this.dispatch('inventory:updated', data);
    this.dispatch('dashboard:refresh', { module: 'inventory' });
  }

  triggerStockUpdate(data) {
    this.dispatch('stock:updated', data);
    this.dispatch('dashboard:refresh', { module: 'stock' });
  }

  triggerProductionUpdate(data) {
    this.dispatch('production:updated', data);
    this.dispatch('dashboard:refresh', { module: 'production' });
  }

  triggerSalesUpdate(data) {
    this.dispatch('sales:updated', data);
    this.dispatch('dashboard:refresh', { module: 'sales' });
  }

  triggerPurchaseUpdate(data) {
    this.dispatch('purchase:updated', data);
    this.dispatch('dashboard:refresh', { module: 'purchase' });
  }

  triggerNotificationReceived(data) {
    this.dispatch('notification:received', data);
    this.showNotificationToast(data);
  }

  triggerWarehouseUpdate(data) {
    this.dispatch('warehouse:updated', data);
    this.dispatch('dashboard:refresh', { module: 'warehouse' });
  }

  // Get real-time data for dashboard
  async getDashboardData() {
    try {
      const response = await fetch('/api/dashboard/real-time', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.dispatch('dashboard:data', data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching real-time dashboard data:', error);
    }
  }

  // Setup periodic updates
  setupPeriodicUpdates() {
    // Update dashboard every 30 seconds
    setInterval(() => {
      this.getDashboardData();
    }, 30000);

    // Check for notifications every 10 seconds
    setInterval(() => {
      this.checkForNotifications();
    }, 10000);
  }

  // Check for new notifications
  async checkForNotifications() {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.dispatch('notifications:count', data);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }

  // Initialize the event system
  init() {
    this.setupPeriodicUpdates();
    console.log('Event system initialized');
  }
}

// Create global instance
const eventSystem = new EventSystem();

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    eventSystem.init();
  });
} else {
  eventSystem.init();
}

export default eventSystem;
