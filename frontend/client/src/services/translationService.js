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
      customerManagement: 'Customer Management',
      bagFoodPurchase: 'Bag & Food Purchase',
      gatePassSystem: 'Gate Pass System',
      reports: 'Reports',
      reportsModule: 'Reports Module',
      notifications: 'Notifications',
      notificationsUtilities: 'Notifications & Utilities',
      systemConfiguration: 'System Configuration',
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
      todayExpenses: 'Today\'s Expenses',

      quickActions: {
        userManagement: 'User Management',
        accounts: 'Accounts',
        financialManagement: 'Financial Management',
        supplierManagement: 'Supplier Management',
        bagFoodPurchase: 'Bag & Food Purchase',
        gatePass: 'Gate Pass System',
        production: 'Production',
        sales: 'Sales',
        warehouse: 'Warehouse',
        warehouseDashboard: 'Warehouse Dashboard',
        inventory: 'Inventory',
        stock: 'Stock',
        employees: 'Employees',
        customerManagement: 'Customer Management',
        reports: 'Reports',
        notifications: 'Notifications & Utilities',
        systemConfiguration: 'System Configuration'
      },

      sections: {
        roleCapabilities: 'Your Role Capabilities',
        availableActions: 'Available Actions',
        moreActionsPrefix: '+',
        moreActionsSuffix: 'more actions available'
      },

      messages: {
        welcomeBack: 'Welcome back',
        userFallback: 'User',
        accessIntro: 'You have access to',
        modulesWord: 'modules',
        basedOn: 'based on your',
        roleWord: 'role'
      },

      capabilities: {
        admin: [
          'Full system access and control',
          'Manage all users and roles',
          'Access to all modules and reports',
          'System configuration and settings'
        ],
        generalManager: [
          'Manage team members and operations',
          'Access to most modules and reports',
          'Limited administrative functions',
          'User management capabilities'
        ],
        salesManager: [
          'Focus on sales operations and customer relationships',
          'Access sales, customer, inventory, warehouse, and supplier modules',
          'Manage customer accounts, orders, and outstanding balances',
          'Monitor sales performance and payment status'
        ],
        productionManager: [
          'Oversee production planning and execution',
          'Manage production costs and efficiency',
          'Coordinate with warehouse for material availability',
          'Generate production reports and analytics'
        ],
        warehouseManager: [
          'Manage stock levels and storage locations',
          'Handle gate pass operations and transfers',
          'Coordinate with production and sales teams',
          'Monitor inventory health and movements'
        ],
        manager: [
          'Manage team members and operations',
          'Access to most modules and reports',
          'Limited administrative functions',
          'User management capabilities'
        ],
        employee: [
          'Access production and warehouse modules',
          'Update stock movements and reports',
          'Assist with daily operational tasks',
          'Limited administrative functions'
        ],
        cashier: [
          'Manage sales transactions and payments',
          'Maintain customer payment records',
          'Generate daily sales summaries',
          'Limited access to other modules'
        ],
        default: 'Capability details will appear here.'
      },

      masters: {
        ledger: 'Ledger',
        bags: 'Bags',
        foodPurchase: 'Food Purchase',
        privatePurchase: 'Private Purchase',
        transactions: 'Transactions',
        help: 'Help'
      },

      stats: {
        cashInHand: 'Cash in Hand',
        totalDebit: 'Total Debit',
        totalCredit: 'Total Credit',
        totalStock: 'Total Stock'
      }
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

    // Purchase Management
    purchaseManagement: {
      title: 'Purchase Management',
      createPurchase: 'Create Purchase',
      editPurchase: 'Edit Purchase',
      purchaseList: 'Purchase List',
      purchaseDate: 'Purchase Date',
      supplier: 'Supplier',
      items: 'Items',
      totalAmount: 'Total Amount',
      paymentStatus: 'Payment Status',
      deliveryDate: 'Delivery Date',
      purchaseType: 'Purchase Type',
      bags: 'Bags',
      food: 'Food'
    },

    // Supplier Management
    supplierManagement: {
      title: 'Supplier Management',
      createSupplier: 'Create Supplier',
      editSupplier: 'Edit Supplier',
      supplierList: 'Supplier List',
      supplierCode: 'Supplier Code',
      contactPerson: 'Contact Person',
      businessType: 'Business Type',
      creditLimit: 'Credit Limit',
      outstandingBalance: 'Outstanding Balance',
      paymentTerms: 'Payment Terms',
      rating: 'Rating',
      notes: 'Notes'
    },

    // Bag & Food Purchase
    bagFoodPurchase: {
      title: 'Bag & Food Purchase',
      bagPurchase: 'Bag Purchase',
      foodPurchase: 'Food Purchase',
      ata: 'ATA',
      maida: 'MAIDA',
      suji: 'SUJI',
      fine: 'FINE',
      wheat: 'Wheat',
      purchaseNumber: 'Purchase Number',
      supplier: 'Supplier',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      totalPrice: 'Total Price',
      subtotal: 'Subtotal',
      tax: 'Tax',
      discount: 'Discount',
      totalAmount: 'Total Amount'
    },

    // Gate Pass System
    gatePassSystem: {
      title: 'Gate Pass System',
      createGatePass: 'Create Gate Pass',
      editGatePass: 'Edit Gate Pass',
      gatePassList: 'Gate Pass List',
      gatePassNumber: 'Gate Pass Number',
      type: 'Type',
      purpose: 'Purpose',
      issuedTo: 'Issued To',
      validUntil: 'Valid Until',
      items: 'Items',
      printOptions: 'Print Options',
      gatePass: 'Gate Pass',
      invoice: 'Invoice',
      both: 'Both',
      whatsappShare: 'WhatsApp Share',
      stockDispatch: 'Stock Dispatch',
      confirmed: 'Confirmed',
      confirmedBy: 'Confirmed By',
      confirmedAt: 'Confirmed At'
    },

    // Customer Management
    customerManagement: {
      title: 'Customer Management',
      createCustomer: 'Create Customer',
      editCustomer: 'Edit Customer',
      customerList: 'Customer List',
      customerCode: 'Customer Code',
      customerName: 'Customer Name',
      contactPerson: 'Contact Person',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      creditLimit: 'Credit Limit',
      outstandingBalance: 'Outstanding Balance',
      paymentTerms: 'Payment Terms',
      status: 'Status'
    },

    // Stock Transfer
    stockTransfer: {
      title: 'Stock Transfer',
      createTransfer: 'Create Transfer',
      editTransfer: 'Edit Transfer',
      transferList: 'Transfer List',
      transferNumber: 'Transfer Number',
      transferType: 'Transfer Type',
      fromWarehouse: 'From Warehouse',
      toWarehouse: 'To Warehouse',
      transferDate: 'Transfer Date',
      items: 'Items',
      requestedQuantity: 'Requested Quantity',
      actualQuantity: 'Actual Quantity',
      status: 'Status',
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected'
    },

    // Repacking
    repacking: {
      title: 'Repacking',
      createRepacking: 'Create Repacking',
      editRepacking: 'Edit Repacking',
      repackingList: 'Repacking List',
      repackingNumber: 'Repacking Number',
      repackingDate: 'Repacking Date',
      sourceProduct: 'Source Product',
      targetProduct: 'Target Product',
      sourceQuantity: 'Source Quantity',
      targetQuantity: 'Target Quantity',
      efficiency: 'Efficiency',
      wastage: 'Wastage',
      cost: 'Cost'
    },

    // Production Cost
    productionCost: {
      title: 'Production Cost',
      dailyCost: 'Daily Cost',
      costBreakdown: 'Cost Breakdown',
      rawMaterialCost: 'Raw Material Cost',
      laborCost: 'Labor Cost',
      overheadCost: 'Overhead Cost',
      totalCost: 'Total Cost',
      costPerUnit: 'Cost Per Unit',
      productionEfficiency: 'Production Efficiency',
      costAnalysis: 'Cost Analysis'
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
    },

    roles: {
      admin: 'Admin',
      generalManager: 'General Manager',
      salesManager: 'Sales Manager',
      productionManager: 'Production Manager',
      warehouseManager: 'Warehouse Manager',
      manager: 'Manager',
      employee: 'Employee',
      cashier: 'Cashier',
      sales: 'Sales'
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
      customerManagement: 'گاہکوں کا انتظام',
      bagFoodPurchase: 'بیگ اور خوراک کی خریداری',
      gatePassSystem: 'گیٹ پاس سسٹم',
      reports: 'رپورٹس',
      reportsModule: 'رپورٹس ماڈیول',
      notifications: 'نوٹیفیکیشنز',
      notificationsUtilities: 'نوٹیفیکیشنز اور یوٹیلیٹیز',
      systemConfiguration: 'سسٹم کنفیگریشن',
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
      todayExpenses: 'آج کے اخراجات',

      quickActions: {
        userManagement: 'صارفین کا انتظام',
        accounts: 'اکاؤنٹس',
        financialManagement: 'مالی انتظام',
        supplierManagement: 'سپلائر کا انتظام',
        bagFoodPurchase: 'بیگ اور خوراک کی خریداری',
        gatePass: 'گیٹ پاس سسٹم',
        production: 'پیداوار',
        sales: 'فروخت',
        warehouse: 'گودام',
        warehouseDashboard: 'گودام ڈیش بورڈ',
        inventory: 'انوینٹری',
        stock: 'اسٹاک',
        employees: 'ملازمین',
        customerManagement: 'گاہکوں کا انتظام',
        reports: 'رپورٹس',
        notifications: 'نوٹیفیکیشنز اور یوٹیلیٹیز',
        systemConfiguration: 'سسٹم کنفیگریشن'
      },

      sections: {
        roleCapabilities: 'آپ کے کردار کی صلاحیتیں',
        availableActions: 'دستیاب اقدامات',
        moreActionsPrefix: '+',
        moreActionsSuffix: 'مزید اقدامات دستیاب ہیں'
      },

      messages: {
        welcomeBack: 'خوش آمدید',
        userFallback: 'صارف',
        accessIntro: 'آپ کو رسائی حاصل ہے',
        modulesWord: 'ماڈیولز',
        basedOn: 'آپ کے',
        roleWord: 'کردار کی بنیاد پر'
      },

      capabilities: {
        admin: [
          'مکمل نظام تک رسائی اور کنٹرول',
          'تمام صارفین اور کرداروں کا انتظام',
          'تمام ماڈیولز اور رپورٹس تک رسائی',
          'سسٹم کنفیگریشن اور ترتیبات'
        ],
        generalManager: [
          'ٹیم ممبران اور آپریشنز کا انتظام',
          'زیادہ تر ماڈیولز اور رپورٹس تک رسائی',
          'محدود انتظامی افعال',
          'صارفین کے انتظام کی صلاحیت'
        ],
        salesManager: [
          'فروخت اور گاہکوں کے تعلقات پر توجہ',
          'فروخت، گاہک، انوینٹری، گودام اور سپلائر ماڈیولز تک رسائی',
          'گاہک کے اکاؤنٹس، آرڈرز اور بقایا جات کا انتظام',
          'فروخت کی کارکردگی اور ادائیگی کی صورتحال کی نگرانی'
        ],
        productionManager: [
          'پیداوار کی منصوبہ بندی اور عملدرآمد کی نگرانی',
          'پیداوار کی لاگت اور کارکردگی کا انتظام',
          'مواد کی دستیابی کے لیے گودام سے ہم آہنگی',
          'پیداوار کی رپورٹس اور تجزیات تیار کریں'
        ],
        warehouseManager: [
          'اسٹاک کی سطح اور ذخیرہ مقامات کا انتظام',
          'گیٹ پاس آپریشنز اور ٹرانسفرز کو سنبھالیں',
          'پیداوار اور فروخت ٹیموں کے ساتھ ہم آہنگی',
          'انوینٹری کی حالت اور حرکت کی نگرانی'
        ],
        manager: [
          'ٹیم ممبران اور آپریشنز کا انتظام',
          'زیادہ تر ماڈیولز اور رپورٹس تک رسائی',
          'محدود انتظامی افعال',
          'صارفین کے انتظام کی صلاحیت'
        ],
        employee: [
          'پیداوار اور گودام ماڈیولز تک رسائی',
          'اسٹاک کی حرکت اور رپورٹوں کو اپ ڈیٹ کریں',
          'روزمرہ کے آپریشنل کاموں میں مدد کریں',
          'محدود انتظامی افعال'
        ],
        cashier: [
          'فروخت کی لین دین اور ادائیگیوں کا انتظام',
          'گاہک کی ادائیگی کے ریکارڈ برقرار رکھیں',
          'روزانہ کی فروخت کا خلاصہ تیار کریں',
          'دیگر ماڈیولز تک محدود رسائی'
        ],
        default: 'صلاحیتوں کی تفصیلات یہاں ظاہر ہوں گی۔'
      },

      masters: {
        ledger: 'لیجر',
        bags: 'بیگز',
        foodPurchase: 'خوراک کی خریداری',
        privatePurchase: 'پرائیویٹ خریداری',
        transactions: 'لین دین',
        help: 'مدد'
      },

      stats: {
        cashInHand: 'نقد رقم',
        totalDebit: 'کل ڈیبٹ',
        totalCredit: 'کل کریڈٹ',
        totalStock: 'کل اسٹاک'
      }
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

    // Purchase Management
    purchaseManagement: {
      title: 'خریداری کا انتظام',
      createPurchase: 'خریداری بنائیں',
      editPurchase: 'خریداری کی ترمیم',
      purchaseList: 'خریداری کی فہرست',
      purchaseDate: 'خریداری کی تاریخ',
      supplier: 'سپلائر',
      items: 'آئٹمز',
      totalAmount: 'کل رقم',
      paymentStatus: 'ادائیگی کی حالت',
      deliveryDate: 'ڈیلیوری کی تاریخ',
      purchaseType: 'خریداری کی قسم',
      bags: 'بیگز',
      food: 'خوراک'
    },

    // Supplier Management
    supplierManagement: {
      title: 'سپلائر کا انتظام',
      createSupplier: 'سپلائر بنائیں',
      editSupplier: 'سپلائر کی ترمیم',
      supplierList: 'سپلائر کی فہرست',
      supplierCode: 'سپلائر کوڈ',
      contactPerson: 'رابطہ شخص',
      businessType: 'کاروبار کی قسم',
      creditLimit: 'کریڈٹ کی حد',
      outstandingBalance: 'زیر التوا بیلنس',
      paymentTerms: 'ادائیگی کی شرائط',
      rating: 'ریٹنگ',
      notes: 'نوٹس'
    },

    // Bag & Food Purchase
    bagFoodPurchase: {
      title: 'بیگ اور خوراک کی خریداری',
      bagPurchase: 'بیگ کی خریداری',
      foodPurchase: 'خوراک کی خریداری',
      ata: 'اٹا',
      maida: 'میدہ',
      suji: 'سوجی',
      fine: 'فائن',
      wheat: 'گندم',
      purchaseNumber: 'خریداری نمبر',
      supplier: 'سپلائر',
      quantity: 'مقدار',
      unitPrice: 'یونٹ قیمت',
      totalPrice: 'کل قیمت',
      subtotal: 'ذیلی کل',
      tax: 'ٹیکس',
      discount: 'رعایت',
      totalAmount: 'کل رقم'
    },

    // Gate Pass System
    gatePassSystem: {
      title: 'گیٹ پاس سسٹم',
      createGatePass: 'گیٹ پاس بنائیں',
      editGatePass: 'گیٹ پاس کی ترمیم',
      gatePassList: 'گیٹ پاس کی فہرست',
      gatePassNumber: 'گیٹ پاس نمبر',
      type: 'قسم',
      purpose: 'مقصد',
      issuedTo: 'جاری کیا گیا',
      validUntil: 'تک درست',
      items: 'آئٹمز',
      printOptions: 'پرنٹ کے اختیارات',
      gatePass: 'گیٹ پاس',
      invoice: 'انوائس',
      both: 'دونوں',
      whatsappShare: 'واٹس ایپ شیئر',
      stockDispatch: 'اسٹاک ڈسپیچ',
      confirmed: 'تصدیق شدہ',
      confirmedBy: 'تصدیق کی گئی',
      confirmedAt: 'تصدیق کی تاریخ'
    },

    // Customer Management
    customerManagement: {
      title: 'گاہکوں کا انتظام',
      createCustomer: 'گاہک بنائیں',
      editCustomer: 'گاہک کی ترمیم',
      customerList: 'گاہکوں کی فہرست',
      customerCode: 'گاہک کوڈ',
      customerName: 'گاہک کا نام',
      contactPerson: 'رابطہ شخص',
      phone: 'فون',
      email: 'ای میل',
      address: 'پتہ',
      creditLimit: 'کریڈٹ کی حد',
      outstandingBalance: 'زیر التوا بیلنس',
      paymentTerms: 'ادائیگی کی شرائط',
      status: 'حیثیت'
    },

    // Stock Transfer
    stockTransfer: {
      title: 'اسٹاک ٹرانسفر',
      createTransfer: 'ٹرانسفر بنائیں',
      editTransfer: 'ٹرانسفر کی ترمیم',
      transferList: 'ٹرانسفر کی فہرست',
      transferNumber: 'ٹرانسفر نمبر',
      transferType: 'ٹرانسفر کی قسم',
      fromWarehouse: 'سے گودام',
      toWarehouse: 'کو گودام',
      transferDate: 'ٹرانسفر کی تاریخ',
      items: 'آئٹمز',
      requestedQuantity: 'درخواست شدہ مقدار',
      actualQuantity: 'اصل مقدار',
      status: 'حیثیت',
      approved: 'منظور شدہ',
      pending: 'زیر التوا',
      rejected: 'مسترد'
    },

    // Repacking
    repacking: {
      title: 'دوبارہ پیکنگ',
      createRepacking: 'ریپیکنگ بنائیں',
      editRepacking: 'ریپیکنگ کی ترمیم',
      repackingList: 'ریپیکنگ کی فہرست',
      repackingNumber: 'ریپیکنگ نمبر',
      repackingDate: 'ریپیکنگ کی تاریخ',
      sourceProduct: 'سورس پروڈکٹ',
      targetProduct: 'ٹارگٹ پروڈکٹ',
      sourceQuantity: 'سورس مقدار',
      targetQuantity: 'ٹارگٹ مقدار',
      efficiency: 'کارکردگی',
      wastage: 'ضیاع',
      cost: 'لاگت'
    },

    // Production Cost
    productionCost: {
      title: 'پیداوار کی لاگت',
      dailyCost: 'روزانہ لاگت',
      costBreakdown: 'لاگت کی تفصیل',
      rawMaterialCost: 'خام مال کی لاگت',
      laborCost: 'مزدوری کی لاگت',
      overheadCost: 'اوور ہیڈ لاگت',
      totalCost: 'کل لاگت',
      costPerUnit: 'فی یونٹ لاگت',
      productionEfficiency: 'پیداوار کی کارکردگی',
      costAnalysis: 'لاگت کا تجزیہ'
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
    },

    roles: {
      admin: 'ایڈمن',
      generalManager: 'جنرل منیجر',
      salesManager: 'سیلز منیجر',
      productionManager: 'پیداوار منیجر',
      warehouseManager: 'گودام منیجر',
      manager: 'منیجر',
      employee: 'ملازم',
      cashier: 'کیشیر',
      sales: 'فروخت'
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
