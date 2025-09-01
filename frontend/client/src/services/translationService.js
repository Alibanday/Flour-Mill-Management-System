// Translation service for multi-language support
const translations = {
  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      noData: 'No data available',
      actions: 'Actions',
      status: 'Status',
      date: 'Date',
      amount: 'Amount',
      quantity: 'Quantity',
      price: 'Price',
      total: 'Total',
      submit: 'Submit',
      reset: 'Reset',
      export: 'Export',
      print: 'Print',
      download: 'Download',
      upload: 'Upload',
      view: 'View',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      language: 'Language',
      logout: 'Logout',
      back: 'Back',
      actions: 'Actions'
    },

    // Navigation
    navigation: {
      dashboard: 'Dashboard',
      userManagement: 'User Management',
      warehouseManagement: 'Warehouse Management',
      inventoryManagement: 'Inventory Management',
      productionManagement: 'Production Management',
      salesManagement: 'Sales Management',
      purchaseManagement: 'Purchase Management',
      financialManagement: 'Financial Management',
      supplierManagement: 'Supplier Management',
      bagFoodPurchase: 'Bag & Food Purchase',
      gatePassSystem: 'Gate Pass System',
      reports: 'Reports',
      notifications: 'Notifications',
      systemConfig: 'System Configuration',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      mainMenu: 'MAIN MENU',
      title: 'Navigation'
    },

    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome to Flour Mill Management System',
      quickStats: 'Quick Statistics',
      recentActivity: 'Recent Activity',
      pendingTasks: 'Pending Tasks',
      totalUsers: 'Total Users',
      totalWarehouses: 'Total Warehouses',
      totalInventory: 'Total Inventory',
      totalSales: 'Total Sales',
      totalProduction: 'Total Production',
      lowStockItems: 'Low Stock Items',
      pendingPayments: 'Pending Payments',
      todaySales: 'Today\'s Sales',
      todayProduction: 'Today\'s Production',
      todayExpenses: 'Today\'s Expenses'
    },

    // User Management
    userManagement: {
      title: 'User Management',
      createUser: 'Create User',
      editUser: 'Edit User',
      userList: 'User List',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      password: 'Password',
      role: 'Role',
      status: 'Status',
      warehouse: 'Warehouse',
      cnic: 'CNIC',
      contact: 'Contact',
      address: 'Address',
      profilePicture: 'Profile Picture',
      admin: 'Admin',
      manager: 'Manager',
      employee: 'Employee',
      cashier: 'Cashier'
    },

    // Warehouse Management
    warehouseManagement: {
      title: 'Warehouse Management',
      createWarehouse: 'Create Warehouse',
      editWarehouse: 'Edit Warehouse',
      warehouseList: 'Warehouse List',
      warehouseNumber: 'Warehouse Number',
      name: 'Name',
      location: 'Location',
      description: 'Description',
      capacity: 'Capacity',
      manager: 'Manager'
    },

    // Inventory Management
    inventoryManagement: {
      title: 'Inventory Management',
      createItem: 'Create Item',
      editItem: 'Edit Item',
      itemList: 'Item List',
      itemName: 'Item Name',
      category: 'Category',
      type: 'Type',
      unit: 'Unit',
      currentStock: 'Current Stock',
      minStock: 'Minimum Stock',
      maxStock: 'Maximum Stock',
      rawMaterials: 'Raw Materials',
      finishedGoods: 'Finished Goods',
      wheat: 'Wheat',
      flour: 'Flour',
      maida: 'Maida',
      suji: 'Suji',
      chokhar: 'Chokhar',
      fine: 'Fine',
      refraction: 'Refraction'
    },

    // Production Management
    productionManagement: {
      title: 'Production Management',
      createProduction: 'Create Production',
      editProduction: 'Edit Production',
      productionList: 'Production List',
      productionDate: 'Production Date',
      product: 'Product',
      quantity: 'Quantity',
      cost: 'Cost',
      wastage: 'Wastage',
      efficiency: 'Efficiency',
      dailyProduction: 'Daily Production',
      productionCost: 'Production Cost',
      repacking: 'Repacking'
    },

    // Sales Management
    salesManagement: {
      title: 'Sales Management',
      createSale: 'Create Sale',
      editSale: 'Edit Sale',
      saleList: 'Sale List',
      invoice: 'Invoice',
      customer: 'Customer',
      items: 'Items',
      discount: 'Discount',
      tax: 'Tax',
      grandTotal: 'Grand Total',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      bank: 'Bank',
      credit: 'Credit',
      return: 'Return'
    },

    // Financial Management
    financialManagement: {
      title: 'Financial Management',
      accounts: 'Accounts',
      transactions: 'Transactions',
      salaries: 'Salaries',
      expenses: 'Expenses',
      income: 'Income',
      profit: 'Profit',
      loss: 'Loss',
      balance: 'Balance',
      payable: 'Payable',
      receivable: 'Receivable',
      bankAccount: 'Bank Account',
      cashFlow: 'Cash Flow'
    },

    // Reports
    reports: {
      title: 'Reports',
      salesReport: 'Sales Report',
      inventoryReport: 'Inventory Report',
      profitLossReport: 'Profit & Loss Report',
      expenseReport: 'Expense Report',
      salaryReport: 'Salary Report',
      vendorReport: 'Vendor Report',
      dateRange: 'Date Range',
      fromDate: 'From Date',
      toDate: 'To Date',
      generateReport: 'Generate Report',
      exportPDF: 'Export PDF',
      exportExcel: 'Export Excel'
    },

    // Notifications
    notifications: {
      title: 'Notifications',
      lowStock: 'Low Stock Alert',
      pendingPayment: 'Pending Payment',
      restockReminder: 'Restock Reminder',
      systemMaintenance: 'System Maintenance',
      userActivity: 'User Activity',
      markAsRead: 'Mark as Read',
      markAllAsRead: 'Mark All as Read',
      deleteNotification: 'Delete Notification'
    },

    // System Configuration
    systemConfig: {
      title: 'System Configuration',
      ui: 'User Interface',
      theme: 'Theme',
      language: 'Language',
      notifications: 'Notifications',
      system: 'System',
      export: 'Export',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      english: 'English',
      urdu: 'Urdu'
    }
  },

  ur: {
    // Common
    common: {
      save: 'محفوظ کریں',
      cancel: 'منسوخ کریں',
      delete: 'حذف کریں',
      edit: 'ترمیم کریں',
      add: 'شامل کریں',
      search: 'تلاش کریں',
      filter: 'فلٹر',
      loading: 'لوڈ ہو رہا ہے...',
      noData: 'کوئی ڈیٹا دستیاب نہیں',
      actions: 'اعمال',
      status: 'حیثیت',
      date: 'تاریخ',
      amount: 'رقم',
      quantity: 'مقدار',
      price: 'قیمت',
      total: 'کل',
      submit: 'جمع کریں',
      reset: 'ری سیٹ کریں',
      export: 'برآمد کریں',
      print: 'پرنٹ کریں',
      download: 'ڈاؤن لوڈ کریں',
      upload: 'اپ لوڈ کریں',
      view: 'دیکھیں',
      close: 'بند کریں',
      back: 'واپس',
      next: 'اگلا',
      previous: 'پچھلا',
      confirm: 'تصدیق کریں',
      yes: 'ہاں',
      no: 'نہیں',
      active: 'فعال',
      inactive: 'غیر فعال',
      pending: 'زیر التوا',
      completed: 'مکمل',
      error: 'خرابی',
      success: 'کامیابی',
      warning: 'انتباہ',
      info: 'معلومات',
      language: 'زبان',
      logout: 'لاگ آؤٹ',
      back: 'واپس',
      actions: 'اعمال'
    },

    // Navigation
    navigation: {
      dashboard: 'ڈیش بورڈ',
      userManagement: 'صارفین کا انتظام',
      warehouseManagement: 'گودام کا انتظام',
      inventoryManagement: 'انوینٹری کا انتظام',
      productionManagement: 'پیداوار کا انتظام',
      salesManagement: 'فروخت کا انتظام',
      purchaseManagement: 'خریداری کا انتظام',
      financialManagement: 'مالی انتظام',
      supplierManagement: 'سپلائر کا انتظام',
      bagFoodPurchase: 'بیگ اور خوراک کی خریداری',
      gatePassSystem: 'گیٹ پاس سسٹم',
      reports: 'رپورٹس',
      notifications: 'نوٹیفیکیشنز',
      systemConfig: 'سسٹم کنفیگریشن',
      settings: 'ترتیبات',
      profile: 'پروفائل',
      logout: 'لاگ آؤٹ',
      login: 'لاگ ان',
      mainMenu: 'مین مینو',
      title: 'نیویگیشن'
    },

    // Dashboard
    dashboard: {
      title: 'ڈیش بورڈ',
      welcome: 'آٹا مل مینجمنٹ سسٹم میں خوش آمدید',
      quickStats: 'فوری اعداد و شمار',
      recentActivity: 'حالیہ سرگرمیاں',
      pendingTasks: 'زیر التوا کام',
      totalUsers: 'کل صارفین',
      totalWarehouses: 'کل گودام',
      totalInventory: 'کل انوینٹری',
      totalSales: 'کل فروخت',
      totalProduction: 'کل پیداوار',
      lowStockItems: 'کم اسٹاک آئٹمز',
      pendingPayments: 'زیر التوا ادائیگیاں',
      todaySales: 'آج کی فروخت',
      todayProduction: 'آج کی پیداوار',
      todayExpenses: 'آج کے اخراجات'
    },

    // User Management
    userManagement: {
      title: 'صارفین کا انتظام',
      createUser: 'صارف بنائیں',
      editUser: 'صارف کی ترمیم',
      userList: 'صارفین کی فہرست',
      firstName: 'پہلا نام',
      lastName: 'آخری نام',
      email: 'ای میل',
      password: 'پاس ورڈ',
      role: 'کردار',
      status: 'حیثیت',
      warehouse: 'گودام',
      cnic: 'شناختی کارڈ',
      contact: 'رابطہ',
      address: 'پتہ',
      profilePicture: 'پروفائل تصویر',
      admin: 'ایڈمن',
      manager: 'مینیجر',
      employee: 'ملازم',
      cashier: 'کیشیر'
    },

    // Warehouse Management
    warehouseManagement: {
      title: 'گودام کا انتظام',
      createWarehouse: 'گودام بنائیں',
      editWarehouse: 'گودام کی ترمیم',
      warehouseList: 'گودام کی فہرست',
      warehouseNumber: 'گودام نمبر',
      name: 'نام',
      location: 'مقام',
      description: 'تفصیل',
      capacity: 'گنجائش',
      manager: 'مینیجر'
    },

    // Inventory Management
    inventoryManagement: {
      title: 'انوینٹری کا انتظام',
      createItem: 'آئٹم بنائیں',
      editItem: 'آئٹم کی ترمیم',
      itemList: 'آئٹم کی فہرست',
      itemName: 'آئٹم کا نام',
      category: 'زمرہ',
      type: 'قسم',
      unit: 'یونٹ',
      currentStock: 'موجودہ اسٹاک',
      minStock: 'کم سے کم اسٹاک',
      maxStock: 'زیادہ سے زیادہ اسٹاک',
      rawMaterials: 'خام مال',
      finishedGoods: 'تیار شدہ سامان',
      wheat: 'گندم',
      flour: 'آٹا',
      maida: 'میدہ',
      suji: 'سوجی',
      chokhar: 'چوکر',
      fine: 'فائن',
      refraction: 'ریفریکشن'
    },

    // Production Management
    productionManagement: {
      title: 'پیداوار کا انتظام',
      createProduction: 'پیداوار بنائیں',
      editProduction: 'پیداوار کی ترمیم',
      productionList: 'پیداوار کی فہرست',
      productionDate: 'پیداوار کی تاریخ',
      product: 'پروڈکٹ',
      quantity: 'مقدار',
      cost: 'لاگت',
      wastage: 'ضیاع',
      efficiency: 'کارکردگی',
      dailyProduction: 'روزانہ کی پیداوار',
      productionCost: 'پیداوار کی لاگت',
      repacking: 'دوبارہ پیکنگ'
    },

    // Sales Management
    salesManagement: {
      title: 'فروخت کا انتظام',
      createSale: 'فروخت بنائیں',
      editSale: 'فروخت کی ترمیم',
      saleList: 'فروخت کی فہرست',
      invoice: 'انوائس',
      customer: 'گاہک',
      items: 'آئٹمز',
      discount: 'رعایت',
      tax: 'ٹیکس',
      grandTotal: 'کل کل',
      paymentMethod: 'ادائیگی کا طریقہ',
      cash: 'نقد',
      bank: 'بینک',
      credit: 'کریڈٹ',
      return: 'واپسی'
    },

    // Financial Management
    financialManagement: {
      title: 'مالی انتظام',
      accounts: 'اکاؤنٹس',
      transactions: 'لین دین',
      salaries: 'تنخواہیں',
      expenses: 'اخراجات',
      income: 'آمدنی',
      profit: 'منافع',
      loss: 'نقصان',
      balance: 'بیلنس',
      payable: 'قابل ادائیگی',
      receivable: 'قابل وصول',
      bankAccount: 'بینک اکاؤنٹ',
      cashFlow: 'نقد بہاؤ'
    },

    // Reports
    reports: {
      title: 'رپورٹس',
      salesReport: 'فروخت کی رپورٹ',
      inventoryReport: 'انوینٹری کی رپورٹ',
      profitLossReport: 'منافع اور نقصان کی رپورٹ',
      expenseReport: 'اخراجات کی رپورٹ',
      salaryReport: 'تنخواہ کی رپورٹ',
      vendorReport: 'سپلائر کی رپورٹ',
      dateRange: 'تاریخ کی حد',
      fromDate: 'شروع کی تاریخ',
      toDate: 'آخر کی تاریخ',
      generateReport: 'رپورٹ بنائیں',
      exportPDF: 'پی ڈی ایف برآمد کریں',
      exportExcel: 'ایکسل برآمد کریں'
    },

    // Notifications
    notifications: {
      title: 'نوٹیفیکیشنز',
      lowStock: 'کم اسٹاک کا انتباہ',
      pendingPayment: 'زیر التوا ادائیگی',
      restockReminder: 'اسٹاک کی یاد دہانی',
      systemMaintenance: 'سسٹم کی دیکھ بھال',
      userActivity: 'صارف کی سرگرمی',
      markAsRead: 'پڑھا ہوا نشان لگائیں',
      markAllAsRead: 'سب کو پڑھا ہوا نشان لگائیں',
      deleteNotification: 'نوٹیفیکیشن حذف کریں'
    },

    // System Configuration
    systemConfig: {
      title: 'سسٹم کنفیگریشن',
      ui: 'صارف انٹرفیس',
      theme: 'تھیم',
      language: 'زبان',
      notifications: 'نوٹیفیکیشنز',
      system: 'سسٹم',
      export: 'برآمد',
      light: 'روشن',
      dark: 'اندھیرا',
      auto: 'خودکار',
      english: 'انگریزی',
      urdu: 'اردو'
    }
  }
};

// Translation function
export const t = (key, language = 'en') => {
  const keys = key.split('.');
  let value = translations[language] || translations.en;
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && value[fallbackKey]) {
          value = value[fallbackKey];
        } else {
          return key; // Return original key if translation not found
        }
      }
    }
  }
  
  return value || key;
};

// Get all translations for a specific key
export const getAllTranslations = (key) => {
  const result = {};
  for (const lang in translations) {
    result[lang] = t(key, lang);
  }
  return result;
};

// Check if translation exists
export const hasTranslation = (key, language = 'en') => {
  const translation = t(key, language);
  return translation !== key;
};

export default translations;
