# AassPass Merchant Onboarding Handbook

## Welcome to AassPass!

Thank you for joining AassPass and helping connect local shoppers with your inventory. This handbook will guide you through the onboarding process and help you get the most out of the platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Store Registration](#store-registration)
3. [Inventory Management](#inventory-management)
4. [POS Integration Options](#pos-integration-options)
5. [Best Practices](#best-practices)
6. [Data Quality Guidelines](#data-quality-guidelines)
7. [Support & Resources](#support--resources)

---

## Getting Started

### Prerequisites

Before you begin, make sure you have:
- ✅ A registered AassPass account
- ✅ Basic information about your store (address, contact info, hours)
- ✅ Your product inventory data ready

### Account Setup

1. **Sign up** at the AassPass app
2. **Navigate** to "Merchant Onboarding" from your profile
3. **Complete** the registration form with accurate store information

---

## Store Registration

### Step 1: Store Information

Provide the following details about your store:

- **Store Name** (required): Your business name as it will appear to customers
- **Description**: Brief description of what makes your store unique
- **Address** (required): Complete physical address
- **Location Coordinates**: Latitude/Longitude for accurate map placement
  - *Tip: Use Google Maps to find your exact coordinates*
- **Contact Information**:
  - Phone number
  - Email address
- **Specialties**: Categories of products you specialize in (e.g., "Electronics, Hardware, Tools")

### Step 2: Business Hours

Set your operating hours for each day of the week. Default hours are:
- Monday-Friday: 9:00 AM - 5:00 PM
- Saturday: 10:00 AM - 2:00 PM
- Sunday: Closed

You can customize these at any time from your dashboard.

---

## Inventory Management

### Store Owner Dashboard

Access your dashboard at: `/dashboard/store/[your-store-id]`

#### Key Features:

1. **View Inventory**: See all products currently listed
2. **Add Products**: Manually add individual products
3. **Update Stock**: Modify quantities and prices in real-time
4. **Import Products**: Bulk upload via CSV
5. **Manage Product Status**: Mark items as in-stock or out-of-stock

### Adding Products Manually

To add a product:

1. Click "Add Product" button
2. Fill in product details:
   - **Name** (required)
   - **Description**
   - **Category**
   - **Price** (required)
   - **Quantity** (required)
3. Click "Add Product" to save

### Real-Time Updates

**Important**: All inventory changes are reflected immediately to customers searching on AassPass. Keep your inventory accurate to provide the best customer experience.

---

## POS Integration Options

### Option 1: CSV Bulk Import

#### CSV Format Requirements

Your CSV file should include the following columns:
```
name,description,category,price,quantity
```

#### Example CSV:
```csv
name,description,category,price,quantity
Premium Widget,High-quality widget,Electronics,29.99,50
Standard Widget,Everyday widget,Hardware,19.99,100
Deluxe Widget,Top-of-the-line,Electronics,49.99,25
```

#### Import Steps:

1. Navigate to "Import Products" tab in your dashboard
2. Click "Upload CSV File"
3. Select your properly formatted CSV file
4. Review imported products and make any necessary adjustments

### Option 2: Manual Entry

For stores with smaller inventories or those wanting more control, manual entry allows you to add products one at a time with full detail customization.

### Option 3: Future POS Integration

We are working on direct integrations with popular POS systems:
- Square
- Shopify POS
- Clover
- Toast

Stay tuned for updates on these integrations!

---

## Best Practices

### Inventory Accuracy

✅ **DO:**
- Update stock levels daily
- Remove discontinued products
- Mark seasonal items appropriately
- Use clear, descriptive product names
- Include accurate pricing

❌ **DON'T:**
- Leave out-of-stock items marked as available
- Use vague product descriptions
- Forget to update prices when they change
- List products you don't actually carry

### Product Information Quality

#### Product Names
- Use clear, searchable names
- Include brand names when applicable
- Example: "Samsung Galaxy S24 Ultra 256GB" instead of "Phone"

#### Descriptions
- Highlight key features
- Include specifications when relevant
- Keep it concise but informative

#### Categories
- Use standard category names
- Be specific (e.g., "Power Tools" vs. "Tools")
- Consistent categorization helps customers find products

### Photos

While not required initially, product photos significantly increase customer engagement:
- Use clear, well-lit images
- Show multiple angles when possible
- Include packaging if relevant

---

## Data Quality Guidelines

### Validation Checklist

Before submitting inventory data, verify:

- [ ] All required fields are complete (name, price, quantity)
- [ ] Prices include proper decimal formatting (e.g., 29.99 not 29.9)
- [ ] Quantities are accurate and up-to-date
- [ ] Product names are clear and searchable
- [ ] Categories are spelled correctly and consistent
- [ ] No duplicate entries

### Common Data Issues

| Issue | Solution |
|-------|----------|
| Products not appearing in search | Check that quantity > 0 and in_stock = true |
| Incorrect pricing | Use decimal format: XX.XX |
| Duplicate products | Search before adding to avoid duplicates |
| Missing information | Fill in all recommended fields |

### Data Security

Your inventory data is:
- ✅ Stored securely with encryption
- ✅ Protected by Row-Level Security (RLS)
- ✅ Only accessible by you and your authorized staff
- ✅ Backed up regularly

---

## Support & Resources

### Getting Help

**Dashboard Issues**
- Email: support@aasspass.com
- In-app: Click "Help" in your dashboard

**General Questions**
- Visit our FAQ: [Link to FAQ]
- Join merchant community: [Link to community]

### Training Resources

- **Video Tutorials**: Step-by-step guides for common tasks
- **Webinars**: Monthly merchant training sessions
- **Knowledge Base**: Searchable help articles

### Success Metrics

Track your store's performance:
- **Search Appearances**: How often your products appear in searches
- **Reservations**: Number of items reserved by customers
- **Customer Reviews**: Build trust with positive feedback

---

## Promotional Materials

### Marketing Your Store

AassPass provides:
- ✅ Store profile page with your branding
- ✅ Inclusion in local search results
- ✅ Map visibility for nearby shoppers
- ✅ Direct customer navigation to your location

### Customer Communication

When customers find your products:
1. They can reserve items for pickup
2. They receive your contact information
3. They can navigate directly to your store
4. They can leave reviews after their visit

### Building Your Reputation

- Respond promptly to customer inquiries
- Maintain accurate inventory
- Provide excellent in-store service
- Encourage satisfied customers to leave reviews

---

## Verification Process

### Store Verification Steps

1. **Submit Registration**: Complete onboarding form
2. **Verification Review**: AassPass team reviews your information (1-2 business days)
3. **Confirmation**: Receive email confirmation when approved
4. **Go Live**: Your store appears in customer searches

### What We Verify

- Business legitimacy
- Accurate contact information
- Physical store location
- Product data quality

---

## Next Steps

After completing onboarding:

1. ✅ Add your initial product inventory
2. ✅ Set up accurate business hours
3. ✅ Upload store photos (optional but recommended)
4. ✅ Test your store profile from a customer perspective
5. ✅ Share your AassPass store link with customers

---

## Contact Information

**AassPass Merchant Support**
- Email: merchants@aasspass.com
- Phone: (555) 123-4567
- Hours: Monday-Friday, 9 AM - 6 PM EST

**Emergency Support**: Available 24/7 for critical issues

---

## Appendix: Keyboard Shortcuts

Speed up your workflow with these shortcuts in the dashboard:

- `Ctrl/Cmd + N`: Add new product
- `Ctrl/Cmd + S`: Save changes
- `Ctrl/Cmd + U`: Upload CSV

---

**Welcome to the AassPass merchant community! We're excited to help you grow your business and connect with local shoppers.**

*Last Updated: 2025*
