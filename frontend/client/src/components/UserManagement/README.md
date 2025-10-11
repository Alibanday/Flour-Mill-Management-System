# User Management Module

## Overview
The User Management Module is a comprehensive system for managing users, roles, and permissions in the FlourMill Pro system. It implements all the functional requirements specified in FR 01-06.

## Features Implemented

### ✅ FR 01: User Creation
- **Complete user profile creation** with all required fields:
  - Personal Information (First Name, Last Name, Email, Phone, CNIC)
  - Address Information (Address, City, State, ZIP Code)
  - Profile Picture upload with preview
  - Role assignment (Admin, General Manager, Sales Manager, Production Manager, Warehouse Manager)
  - Warehouse assignment for managers
  - Active/Inactive status

### ✅ FR 02: Role Editing
- **Dynamic role management** with role descriptions
- **Role-based validation** (e.g., managers must be assigned to warehouses)
- **Real-time role updates** with immediate effect

### ✅ FR 03: User Information Editing
- **Full user profile editing** capability
- **Form pre-population** with existing data
- **Validation preservation** during updates
- **Profile picture management**

### ✅ FR 04: User Activation/Deactivation
- **Toggle user status** between active and inactive
- **Visual status indicators** with color-coded badges
- **Status filtering** in user lists
- **Immediate status updates**

### ✅ FR 05: User Authentication
- **Secure login system** with email and password
- **Form validation** and error handling
- **JWT token management** for session handling
- **Demo credentials** for testing

### ✅ FR 06: Warehouse Assignment
- **Manager-warehouse assignment** system
- **Multiple warehouse support** per manager
- **Visual assignment indicators** with checkboxes
- **Validation** ensuring managers have warehouse assignments

## Components Structure

```
UserManagement/
├── UserForm.jsx          # User creation/editing form
├── UserList.jsx          # User listing and management
├── README.md            # This documentation
└── index.js             # Module exports (if needed)

Auth/
├── LoginForm.jsx        # User authentication form
└── README.md           # Authentication documentation
```

## Technical Implementation

### State Management
- **React Hooks** for local component state
- **Form state management** with controlled components
- **Error handling** with real-time validation
- **Loading states** for better UX

### API Integration
- **Axios** for HTTP requests
- **JWT token authentication** in headers
- **FormData** for file uploads
- **Error handling** with user-friendly messages

### UI/UX Features
- **Responsive design** with Tailwind CSS
- **Modal forms** for better user experience
- **Search and filtering** capabilities
- **Real-time validation** feedback
- **Loading indicators** and success messages
- **Confirmation modals** for destructive actions

### Security Features
- **Input validation** on both client and server
- **Role-based access control** (RBAC)
- **Secure password handling** (not stored in frontend)
- **JWT token management** for sessions

## API Endpoints Used

### Authentication
- `POST /api/auth/login` - User login

### User Management
- `GET /api/users` - Fetch all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update existing user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Toggle user status

### Warehouse Management
- `GET /api/warehouses` - Fetch available warehouses

## Usage Examples

### Creating a New User
1. Navigate to User Management page
2. Click "Add User" button
3. Fill in required information
4. Select appropriate role
5. Assign warehouses (if manager role)
6. Upload profile picture (optional)
7. Click "Create User"

### Editing User Role
1. Find user in the user list
2. Click edit button (pencil icon)
3. Change role from dropdown
4. Update warehouse assignments if needed
5. Click "Update User"

### Activating/Deactivating User
1. Find user in the user list
2. Click status toggle button (eye/eye-slash icon)
3. Confirm action in confirmation modal

## Role Descriptions

### Admin
- **Full system access** to all modules and system settings
- **Complete user management** capabilities
- **System configuration** and administration access
- **Complete oversight** of all operations

### General Manager
- **Overall operations management** and oversight
- **User and warehouse management** responsibilities
- **Financial management** and reporting access
- **Supplier and purchase** operations management

### Sales Manager
- **Sales operations** and customer management
- **Sales transaction** processing and management
- **Customer relationship** management
- **Sales reporting** and financial data access

### Production Manager
- **Production processes** and quality control
- **Production workflow** management
- **Warehouse and inventory** access for production
- **Production reporting** and gate pass management

### Warehouse Manager
- **Inventory and warehouse** operations
- **Warehouse management** and stock operations
- **Gate pass** creation and management
- **Warehouse reporting** and inventory tracking

## Validation Rules

### Required Fields
- First Name
- Last Name
- Email (valid format)
- Phone Number
- CNIC (Pakistani format: 12345-1234567-1)
- Role
- Password (for new users)

### Conditional Validation
- **Managers** must be assigned to at least one warehouse
- **Email** must be unique and valid format
- **CNIC** must follow Pakistani format
- **Password** must be at least 6 characters

## Error Handling

### Client-Side Validation
- **Real-time feedback** during form input
- **Field-specific error messages**
- **Form submission prevention** if validation fails

### Server-Side Error Handling
- **API error responses** with user-friendly messages
- **Network error handling** with retry options
- **Validation error display** from server responses

## Future Enhancements

### Planned Features
- **Advanced role permissions** with granular access control
- **User activity logging** and audit trails
- **Bulk user operations** (import/export)
- **Password reset** functionality
- **Two-factor authentication** (2FA)
- **User session management** and monitoring

### Integration Points
- **Notification system** for user status changes
- **Audit logging** for compliance requirements
- **Advanced reporting** for user analytics
- **API rate limiting** and security enhancements

## Testing

### Demo Credentials
The system includes demo accounts for testing:
- **Admin**: admin@flourmill.com / password123
- **Manager**: manager@flourmill.com / password123
- **Employee**: employee@flourmill.com / password123

### Test Scenarios
1. **User Creation** - Test all required fields and validation
2. **Role Assignment** - Test different roles and permissions
3. **Warehouse Assignment** - Test manager-warehouse relationships
4. **Status Management** - Test user activation/deactivation
5. **Form Validation** - Test client-side and server-side validation
6. **Error Handling** - Test various error scenarios

## Dependencies

### Frontend Libraries
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **React Icons** - Icon library
- **Tailwind CSS** - Styling

### Backend Requirements
- **Node.js/Express** server
- **JWT authentication** middleware
- **File upload** handling (multer)
- **Database** with user and warehouse models
- **Password hashing** (bcrypt)

## Security Considerations

### Data Protection
- **Sensitive data** not stored in frontend
- **JWT tokens** for secure authentication
- **Input sanitization** to prevent XSS
- **CSRF protection** through proper headers

### Access Control
- **Role-based permissions** enforced
- **Admin-only access** to user management
- **Session management** with token expiration
- **Secure logout** with token removal

## Performance Optimizations

### Frontend
- **Debounced search** for better performance
- **Lazy loading** of user images
- **Efficient re-rendering** with React hooks
- **Optimized form validation** with minimal re-renders

### Backend
- **Pagination** for large user lists
- **Indexed database queries** for fast searches
- **Caching** of frequently accessed data
- **Efficient file handling** for profile pictures

## Troubleshooting

### Common Issues
1. **Form validation errors** - Check required fields and format requirements
2. **Image upload failures** - Verify file size and format
3. **API connection errors** - Check backend server status
4. **Role assignment issues** - Ensure proper warehouse assignments for managers

### Debug Information
- **Console logging** for development debugging
- **Network tab** for API request monitoring
- **React DevTools** for component state inspection
- **Browser storage** for token and user data verification

## Support and Maintenance

### Documentation Updates
- Keep this README updated with new features
- Document any API changes or new endpoints
- Update validation rules and error messages
- Maintain testing scenarios and demo data

### Code Maintenance
- Regular dependency updates
- Security patch applications
- Performance monitoring and optimization
- Code quality improvements and refactoring
