export const LEAD_STATUSES = [
  { value: 'new',             label: 'New Lead',        color: 'bg-purple-100 text-purple-700' },
  { value: 'contacted',       label: 'Contacted',       color: 'bg-blue-100 text-blue-700' },
  { value: 'interested',      label: 'Interested',      color: 'bg-cyan-100 text-cyan-700' },
  { value: 'hot',             label: 'Hot Lead',        color: 'bg-red-100 text-red-700' },
  { value: 'warm',            label: 'Warm Lead',       color: 'bg-orange-100 text-orange-700' },
  { value: 'cold',            label: 'Cold Lead',       color: 'bg-gray-100 text-gray-600' },
  { value: 'visit_scheduled', label: 'Visit Scheduled', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'visit_completed', label: 'Visit Completed', color: 'bg-teal-100 text-teal-700' },
  { value: 'negotiation',     label: 'Negotiation',     color: 'bg-yellow-100 text-yellow-700' },
  { value: 'booked',          label: 'Booking Done',    color: 'bg-green-100 text-green-700' },
  { value: 'lost',            label: 'Lost',            color: 'bg-red-100 text-red-600' },
  { value: 'not_interested',  label: 'Not Interested',  color: 'bg-gray-100 text-gray-500' },
]

export const LEAD_SOURCES = [
  { value: 'facebook',    label: 'Facebook' },
  { value: 'instagram',   label: 'Instagram' },
  { value: 'google_ads',  label: 'Google Ads' },
  { value: 'website',     label: 'Website' },
  { value: 'justdial',    label: 'JustDial' },
  { value: 'magicbricks', label: 'MagicBricks' },
  { value: 'housing',     label: 'Housing.com' },
  { value: 'referral',    label: 'Referral' },
  { value: 'walk_in',     label: 'Walk-in' },
  { value: 'hoarding',    label: 'Hoarding' },
  { value: 'newspaper',   label: 'Newspaper' },
  { value: 'broker',      label: 'Broker' },
  { value: 'other',       label: 'Other' },
]

export const INVENTORY_STATUSES = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-700' },
  { value: 'blocked',   label: 'Blocked',   color: 'bg-yellow-100 text-yellow-700' },
  { value: 'booked',    label: 'Booked',    color: 'bg-orange-100 text-orange-700' },
  { value: 'sold',      label: 'Sold',      color: 'bg-red-100 text-red-700' },
]

export const VISIT_STATUSES = [
  { value: 'scheduled',   label: 'Scheduled',   color: 'bg-blue-100 text-blue-700' },
  { value: 'completed',   label: 'Completed',   color: 'bg-green-100 text-green-700' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'cancelled',   label: 'Cancelled',   color: 'bg-red-100 text-red-700' },
]

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'paid',    label: 'Paid',    color: 'bg-green-100 text-green-700' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-700' },
  { value: 'partial', label: 'Partial', color: 'bg-orange-100 text-orange-700' },
]

export const BOOKING_STATUSES = [
  { value: 'confirmed',  label: 'Confirmed',  color: 'bg-green-100 text-green-700' },
  { value: 'cancelled',  label: 'Cancelled',  color: 'bg-red-100 text-red-700' },
  { value: 'registered', label: 'Registered', color: 'bg-blue-100 text-blue-700' },
]

export const TASK_PRIORITIES = [
  { value: 'low',    label: 'Low',    color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  { value: 'high',   label: 'High',   color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

export const TASK_STATUSES = [
  { value: 'pending',     label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed',   label: 'Completed',   color: 'bg-green-100 text-green-700' },
  { value: 'cancelled',   label: 'Cancelled',   color: 'bg-gray-100 text-gray-500' },
]

export const USER_ROLES = [
  { value: 'admin',           label: 'Admin',           color: 'bg-purple-100 text-purple-700' },
  { value: 'sales_manager',   label: 'Sales Manager',   color: 'bg-orange-100 text-orange-700' },
  { value: 'sales_executive', label: 'Sales Executive', color: 'bg-blue-100 text-blue-700' },
  { value: 'accounts',        label: 'Accounts Team',   color: 'bg-teal-100 text-teal-700' },
]

export const PROPERTY_TYPES = ['1 BHK','2 BHK','3 BHK','4 BHK','Studio','Penthouse']
export const WINGS = ['A','B','C','D']
export const FACINGS = ['East','West','North','South','North-East','North-West','South-East','South-West']
export const PAYMENT_MODES = ['Cash','Cheque','RTGS','NEFT','Demand Draft','UPI']

export const NAV_ITEMS = [
  { key:'dashboard',  label:'Dashboard',       icon:'LayoutDashboard', path:'/' },
  { key:'leads',      label:'Lead Management', icon:'Users',           path:'/leads' },
  { key:'sitevisits', label:'Site Visits',     icon:'Building2',       path:'/site-visits' },
  { key:'inventory',  label:'Inventory',       icon:'Warehouse',       path:'/inventory' },
  { key:'bookings',   label:'Bookings',        icon:'ClipboardList',   path:'/bookings' },
  { key:'payments',   label:'Payments',        icon:'CreditCard',      path:'/payments' },
  { key:'customers',  label:'Customers',       icon:'UserCheck',       path:'/customers' },
  { key:'brokers',    label:'Brokers',         icon:'Handshake',       path:'/brokers' },
  { key:'tasks',      label:'Tasks',           icon:'CheckSquare',     path:'/tasks' },
  { key:'reports',    label:'Reports',         icon:'BarChart2',       path:'/reports' },
  { key:'settings',   label:'Settings',        icon:'Settings',        path:'/settings' },
]
